# ここでは\nは改行を意味する!
print('C:\some\name')
# C:\some
# ame

# 引用符の前のrに注目
print(r'C:\some\name')
# C:\some\name

# 0番目(含む)から2番目(含めない)までの文字
word = 'Python'
print(word[0:2])
# Py

# 文字列の長さを測る
s = 'supercalifragilisticexpialidocioussss'
print(len(s))
# 37