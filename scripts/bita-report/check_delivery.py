"""Read-only bot and destination validation. No Telegram messages sent."""
import os
from daily_report import request_json, ReportError

def call(method,payload):
 import json
 return request_json('https://api.telegram.org/bot'+os.environ['TELEGRAM_BOT_TOKEN']+'/'+method,data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})

def main():
 me=call('getMe',{});chat=call('getChat',{'chat_id':os.environ['TELEGRAM_CHAT_ID']})
 if not me.get('ok') or not chat.get('ok'):raise ReportError('Bot or target chat not accessible')
 bot=me['result'];target=chat['result']
 if str(target['id'])!=str(os.environ['TELEGRAM_CHAT_ID']):raise ReportError('Unexpected Telegram destination')
 member=call('getChatMember',{'chat_id':target['id'],'user_id':bot['id']})
 status=member.get('result',{}).get('status')
 if status not in ['member','administrator','creator']:raise ReportError('Bot is not a member of target chat')
 print('Bot: @'+bot['username']);print('Target chat: '+target.get('title','private'));print('Membership: '+status);print('Read-only check passed. No messages sent.')

if __name__=='__main__':
 try:main()
 except Exception:
  raise SystemExit('Delivery check failed; credentials and response bodies omitted')
