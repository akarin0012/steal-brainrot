# -*- coding: utf-8 -*-
import subprocess, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

dev = bytes.fromhex('e9968be799ba').decode('utf-8')
p = os.path.join(r'C:\Users\PC_User\Desktop', dev, 'steal-brainrot')
os.chdir(p)

r = subprocess.run(['git', 'add', '-A'], capture_output=True)
print('add:', r.returncode)

parts = [
    'refactor: ',
    bytes.fromhex('e382b3e383bce38389e59381e8b3aa').decode('utf-8'),  # コード品質
    bytes.fromhex('e383bbe38391e38395e382a9e383bce3839ee383b3e382b9').decode('utf-8'),  # ・パフォーマンス
    bytes.fromhex('e694b9e59684').decode('utf-8'),  # 改善
    bytes.fromhex('efbc88').decode('utf-8'),  # （
    'Map',
    bytes.fromhex('e381a7').decode('utf-8'),  # で
    'O(1)',
    bytes.fromhex('e6a49ce7b4a2').decode('utf-8'),  # 検索
    bytes.fromhex('e383bb').decode('utf-8'),  # ・
    bytes.fromhex('e38387e38383e38389e382b3e383bce38389e5898ae999a4').decode('utf-8'),  # デッドコード削除
    bytes.fromhex('e383bb').decode('utf-8'),  # ・
    bytes.fromhex('e59e8be5ae89e585a8').decode('utf-8'),  # 型安全
    'overlay',
    bytes.fromhex('e383bbe383a2e383bce38380e383ab').decode('utf-8'),  # ・モーダル
    'ARIA',
    bytes.fromhex('e5afbee5bf9c').decode('utf-8'),  # 対応
    bytes.fromhex('efbc89').decode('utf-8'),  # ）
]
msg = ''.join(parts)

env = os.environ.copy()
env['GIT_AUTHOR_NAME'] = 'AI Assistant'
env['GIT_AUTHOR_EMAIL'] = 'ai@assistant.local'
env['GIT_COMMITTER_NAME'] = 'AI Assistant'
env['GIT_COMMITTER_EMAIL'] = 'ai@assistant.local'

r = subprocess.run(['git', 'commit', '-m', msg], capture_output=True, env=env)
print('commit stdout:', r.stdout.decode('utf-8', errors='replace'))
print('commit stderr:', r.stderr.decode('utf-8', errors='replace'))
print('commit exit:', r.returncode)

r = subprocess.run(['git', 'status', '--short'], capture_output=True)
print('status:', r.stdout.decode('utf-8', errors='replace'))

r = subprocess.run(['git', 'log', '--oneline', '-6'], capture_output=True)
print('log:', r.stdout.decode('utf-8', errors='replace'))
