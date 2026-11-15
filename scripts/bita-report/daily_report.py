"""Daily /bita/ Metrica summary. Secrets stay in the job environment, never in logs."""
import argparse
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from zoneinfo import ZoneInfo

COUNTER = '113296360'
GOALS = {'strike':681837992,'pack':681838049,'collection':681838053,'slammer':681838152,'share':681838153,'win':681838154,'miss':681838245,'overload':681838302}
BASE = ['ym:s:users','ym:s:visits','ym:s:pageviews','ym:s:avgVisitDurationSeconds']
METRICS = BASE + [f'ym:s:goal{value}reaches' for value in GOALS.values()] + [f'ym:s:goal{GOALS["strike"]}users']

class ReportError(Exception):
    pass

def request_json(url, *, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.load(response)
    except urllib.error.HTTPError as exc:
        raise ReportError(f'Remote API returned HTTP {exc.code}; credentials and response body omitted') from None
    except Exception:
        raise ReportError('Remote API unavailable; credentials and response body omitted') from None
    return result

def yesterday(now=None):
    return ((now or dt.datetime.now(ZoneInfo('Europe/Moscow'))).astimezone(ZoneInfo('Europe/Moscow')).date()-dt.timedelta(days=1)).isoformat()

def report_url(day):
    dt.date.fromisoformat(day)
    return 'https://api-metrika.yandex.net/stat/v1/data?' + urllib.parse.urlencode({'ids':COUNTER,'date1':day,'date2':day,'metrics':','.join(METRICS),'filters':"ym:s:startURL=='https://mosolov.dev/bita/'",'accuracy':'full','limit':1})

def parse_totals(result):
    totals=result.get('totals')
    if not isinstance(totals,list) or len(totals)!=len(METRICS):
        raise ReportError('Metrica returned an incomplete report; no zero-filled report was sent')
    if any(not isinstance(x,(int,float)) or x<0 for x in totals):
        raise ReportError('Metrica returned invalid report values')
    return dict(zip(METRICS,totals))

def duration(seconds):
    total=max(0,round(seconds));m,s=divmod(total,60)
    return f'{m} мин {s:02d} с' if m else f'{s} с'

def summary(day,values):
    users=values[BASE[0]];visits=values[BASE[1]];average=values[BASE[3]]
    reaches={key:values[f'ym:s:goal{value}reaches'] for key,value in GOALS.items()}
    players=values[f'ym:s:goal{GOALS["strike"]}users'];strikes=reaches['strike']
    n=lambda x:str(round(x))
    ratio=lambda a,b:f'{a/b:.1f}'.replace('.',',') if b else '—'
    lines=[f'🎯 Фишки · {dt.date.fromisoformat(day).strftime("%d.%m.%Y")}',f'Посетители: {n(users)} · визиты: {n(visits)}',f'Играли: {n(players)}',f'Время за визит: {duration(average)}',f'Суммарное время на посетителя: {duration(average*visits/users) if users else "—"}',f'Удары: {n(strikes)}',f'На игрока: {ratio(strikes,players)} · на посетителя: {ratio(strikes,users)}',f'Удары с выигрышем: {n(reaches["win"])} · без: {n(reaches["miss"])}',f'Передержали кнопку: {n(reaches["overload"])}',f'Открыли пачку: {n(reaches["pack"])}',f'Коллекция: {n(reaches["collection"])} · выбор биты: {n(reaches["slammer"])}',f'Нажали поделиться: {n(reaches["share"])}']
    return '\n'.join(lines)

def telegram_send(token,chat_id,text,thread_id=None):
    payload={'chat_id':chat_id,'text':text,'link_preview_options':{'is_disabled':True},'disable_notification':True}
    if thread_id:payload['message_thread_id']=int(thread_id)
    result=request_json('https://api.telegram.org/bot'+token+'/sendMessage',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
    if not result.get('ok') or not result.get('result',{}).get('message_id'):
        raise ReportError('Telegram did not confirm delivery; response body omitted')
    return result['result']['message_id']

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--date',default=os.environ.get('REPORT_DATE') or yesterday());parser.add_argument('--dry-run',action='store_true');args=parser.parse_args()
    token=os.environ.get('METRICA_TOKEN');bot=os.environ.get('TELEGRAM_BOT_TOKEN');chat=os.environ.get('TELEGRAM_CHAT_ID')
    missing=[key for key in ['METRICA_TOKEN','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID'] if not os.environ.get(key)]
    if missing:raise ReportError('Missing configuration: '+', '.join(missing))
    result=request_json(report_url(args.date),headers={'Authorization':'OAuth '+token})
    text=summary(args.date,parse_totals(result))
    if args.dry_run:
        print('Report fetched and validated. Dry run: no Telegram send; report body omitted.')
    else:
        telegram_send(bot,chat,text,os.environ.get('TELEGRAM_THREAD_ID'))
        print('Telegram confirmed daily report delivery. Report body omitted.')

if __name__=='__main__':
    try:main()
    except (ReportError,ValueError) as exc:
        print(str(exc),file=sys.stderr);sys.exit(1)
