# -*- coding: utf-8 -*-
import subprocess, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

dev = bytes.fromhex('e9968be799ba').decode('utf-8')
p = os.path.join(r'C:\Users\PC_User\Desktop', dev, 'steal-brainrot')
os.chdir(p)

r = subprocess.run(['git', 'add', '-A'], capture_output=True)
print('add:', r.returncode)

msg = (
    'fix: Medium'
    + bytes.fromhex('e584aae58588e5baa6').decode('utf-8')  # 優先度
    + bytes.fromhex('e381ae').decode('utf-8')  # の
    + '5'
    + bytes.fromhex('e4bbb6e38292e4bfaee6ada3').decode('utf-8')  # 件を修正
    + bytes.fromhex('efbc88').decode('utf-8')  # （
    + bytes.fromhex('e7b58ce6b888').decode('utf-8')  # 経済
    + 'tick'
    + bytes.fromhex('e382ade383a3e38383e38381e382a2e38383e38397').decode('utf-8')  # キャッチアップ
    + bytes.fromhex('e383bb').decode('utf-8')  # ・
    + bytes.fromhex('e382b3e383b3e38399e382a2e8bf94e98791e6bc8fe3828c').decode('utf-8')  # コンベア返金漏れ
    + bytes.fromhex('e383bb').decode('utf-8')  # ・
    + bytes.fromhex('e382afe382a2e9878de8a487').decode('utf-8')  # ギア重複
    + 'effect'
    + bytes.fromhex('e383bb').decode('utf-8')  # ・
    + 'store'
    + bytes.fromhex('e5bc95e695b0e6a49ce8a8bc').decode('utf-8')  # 引数検証
    + bytes.fromhex('e383bb').decode('utf-8')  # ・
    + 'persist'
    + bytes.fromhex('e695b4e59088e680a7').decode('utf-8')  # 整合性
    + bytes.fromhex('efbc89').decode('utf-8')  # ）
)

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
