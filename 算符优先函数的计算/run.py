"""
从优先关系表得到优先关系函数
author: acring

"""


def printfg():  # 显示优先函数
    print('f:{}'.format(fg[0]))
    print('g:{}'.format(fg[1]))


terminal = '+*i()'  # 终结符

relation = ['><<<>',  # 关系表
            '>><<>',
            '>>  >',
            '<<<<=',
            '>>  >']

for x in range(len(terminal)+1):  # 显示关系表
    if x == 0:
        print(" ", end='')
    else:
        print(terminal[x-1], end='')
    for y in range(len(terminal)):
        if x == 0:
            print(" ", terminal[y], end='')
        else:
            print(" ", relation[x-1][y], end='')
    print()


fg = []
fg.append([1]*len(terminal))  # 初始化优先函数
fg.append([1]*len(terminal))

printfg()
for t in range(2):  # 迭代次数
    for x in range(len(relation)):
        for y in range(len(relation)):
            print(terminal[x], relation[x][y], terminal[y])

            if relation[x][y] == '>' and fg[0][x] <= fg[1][y]:
                fg[0][x] = fg[1][y] + 1

            elif relation[x][y] == '<' and fg[0][x] >= fg[1][y]:
                fg[1][y] = fg[0][x] + 1

            elif relation[x][y] == '=':
                fg[0][x] = max(fg[0][x], fg[1][y])
                fg[1][y] = fg[0][x]
            printfg()
