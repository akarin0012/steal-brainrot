import subprocess, os

p = os.path.join(r'C:\Users\PC_User\Desktop', bytes.fromhex('e9968be799ba').decode('utf-8'), 'steal-brainrot')

env = os.environ.copy()
env['GIT_AUTHOR_NAME'] = 'dev'
env['GIT_AUTHOR_EMAIL'] = 'dev@local'
env['GIT_COMMITTER_NAME'] = 'dev'
env['GIT_COMMITTER_EMAIL'] = 'dev@local'

subprocess.run('git add -A', cwd=p, shell=True, env=env)

msg = b'fix: Critical5\xe4\xbb\xb6\xe4\xbf\xae\xe6\xad\xa3(TOCTOU\xe7\x9b\x97\xe3\x81\xbf\xe3\x83\x90\xe3\x82\xb0\xe3\x83\xbb\xe3\x82\xb7\xe3\x83\xbc\xe3\x83\xab\xe3\x83\x89\xe5\x87\x8d\xe7\xb5\x90\xe3\x83\xbb\xe3\x82\xb3\xe3\x83\xb3\xe3\x83\x99\xe3\x82\xa2\xe3\x83\xaa\xe3\x82\xbb\xe3\x83\x83\xe3\x83\x88\xe3\x83\xbbmutation\xe5\xae\x89\xe5\x85\xa8\xe5\x8c\x96\xe3\x83\xbbNPC\xe3\x83\x87\xe3\x83\xbc\xe3\x82\xbf\xe6\xa4\x9c\xe8\xa8\xbc)'.decode('utf-8')

r = subprocess.run(['git', 'commit', '-m', msg], cwd=p, capture_output=True, env=env)
print(r.stdout.decode('utf-8', 'replace'))
print(r.stderr.decode('utf-8', 'replace'))
print('exit:', r.returncode)
