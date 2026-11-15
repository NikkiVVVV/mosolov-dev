import unittest
import datetime as dt
from urllib.parse import urlparse,parse_qs
from daily_report import *
class Tests(unittest.TestCase):
 def test_timezone(self):self.assertEqual(yesterday(dt.datetime(2026,11,15,22,tzinfo=dt.timezone.utc)),'2026-11-15')
 def test_filters(self):
  q=parse_qs(urlparse(report_url('2026-11-15')).query);self.assertEqual(q['filters'],["ym:s:startURL=='https://mosolov.dev/bita/'"]);self.assertEqual(q['date1'],q['date2'])
 def test_totals(self):
  values=[10,20,20,60]+[40,10,5,3,2,16,24,1]+[5];text=summary('2026-11-15',parse_totals({'totals':values}));self.assertIn('На игрока: 8,0 · на посетителя: 4,0',text);self.assertIn('Суммарное время на посетителя: 2 мин 00 с',text);self.assertIn('Нажали поделиться: 2',text)
 def test_zero(self):self.assertIn('На игрока: —',summary('2026-11-15',parse_totals({'totals':[0]*len(METRICS)})))
 def test_incomplete(self):
  with self.assertRaises(ReportError):parse_totals({'totals':[0]})
if __name__=='__main__':unittest.main()
