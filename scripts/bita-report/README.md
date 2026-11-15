# /bita/ daily Telegram report

Counter 113296360. Additional allowed address: mosolov.dev/bita/. All queries restrict entry URL to https://mosolov.dev/bita/. Counter timezone: Europe/Moscow. Goals in daily_report.py were created in the account UI on 2026-11-15.

GitHub Actions runs at 07:00 UTC (10:00 Moscow), for the previous Moscow calendar day. GitHub may delay scheduled jobs. No email reports are configured. GitHub itself may have account-level workflow notification settings; this workflow doesn't send email.

Repository Actions secrets:
- METRICA_TOKEN — OAuth with metrika:read only.
- TELEGRAM_BOT_TOKEN — existing bot that is a member of the intended admin chat.
- TELEGRAM_CHAT_ID — intended group ID.
- TELEGRAM_THREAD_ID — optional, only if a forum topic ID is confirmed; a message link ID alone is not a topic ID.

Workflow modes: report (one real summary), dry-run (API query/validation with no send), check-delivery (read-only bot/chat membership check). Scheduled runs skip until required secrets exist and say so explicitly. No report bodies, API tokens or raw API errors are printed in public job logs.

Metrics: visitors, visits, average visit duration, derived summed visit duration per visitor, actual strikes (not all clicks/holds), unique players, strikes/player, strikes/visitor, wins/misses/overloads and pack/collection/slammer/share-click goal counts. Overload isn't counted as a normal strike. Share click is not proof that a message was sent. Metrica visitors are browser estimates, not identified people. Average visit duration is not active gameplay time.

Local checks: `node tests/analytics.mjs`, `python3 -m unittest discover -s reporting -p 'test_*.py'`. For API verification use workflow dry-run, then report. Bot checks don't call getUpdates or change webhooks, preserving the existing bot's update delivery.
