let grammar = []  // 文法
let lang = ''  // 语言
let itemSet = []  // 项目集
let itemfamily = []  // 项目规范族

let terminalSymbols = new Set();  // 终结符
let unterminalSymbols = new Set();  // 非终结符
let first = {};  // FIRST集
let follow = {};  // FOLLOW集
let goMap = []  // Go函数
let log = ''  // 日志
let ACTION = []
let GOTO = []

function init(){
  grammar = []  // 文法
  lang = '';
  itemSet = []  // 项目集
  itemfamily = []  // 项目规范族

  terminalSymbols = new Set();  // 终结符
  unterminalSymbols = new Set();  // 非终结符
  goMap = []  // Go函数
  log = ''  // 日志
  ACTION = []
  GOTO = []
  document.getElementById('process').innerHTML = '';
  document.getElementById('sheet').innerHTML = '';
  document.getElementById('first').innerHTML = '';
  document.getElementById('follow').innerHTML = '';


}

function analyse(){  // 开始分析
  init();
   grammarRaw = document.getElementById('grammar').value;
   lang = document.getElementById('lang').value;

   let lines = grammarRaw.split('\n')

   for(let i = 0; i<lines.length; i++){  // 分析文法
     tempGrammar = genGrammar(lines[i])
     if(!tempGrammar){
       showLog();
       return
     }
     grammar = grammar.concat(tempGrammar)
   }

   grammar.unshift({key: 'S\'', value: grammar[0]['key'], dot: 0});
   console.log(grammar);

   collectSign();
   handleFIRST();
   handleFOLLOW();

   addLog('---拓广文法----');
   for(let i = 0; i < grammar.length; i++){  // 日志打印拓广文法
     addLog(grammarToString(grammar[i]))
   }

   for(let i = 0; i < grammar.length; i++){  // 生成项目集
     for(let j = 0; j <= grammar[i]['value'].length; j++){
       itemSet.push({key: grammar[i]['key'], value: grammar[i]['value'], dot: j});
     }
   }
   console.log(itemSet);
   addLog('---项目集---');
   for(let i = 0; i < itemSet.length; i++){  // 日志打印项目集
     addLog(itemSetToString(itemSet[i]));
   }

   itemfamily.push(closure([itemSet[0]]));
   genItemFamily();
   addLog('---项目集规范族---');
   for(let i = 0; i < itemfamily.length; i++){  // 日志打印项目集规范族
     addLog('I'+ i);
     for(item of itemfamily[i]){
       addLog(itemSetToString(item));
     }
   }

   showDFA();
   showFIRST();
   showFOLLOW();
   genACTIONGOTO();
   showSLRSheet();
   showProcess();
}

// 显示分析过程
function showProcess() {
  if(lang.trim() == ''){
  	return;
  }
  processHTML = `<tr>
    <th>步骤</th>
    <th>状态栈</th>
    <th>符号栈</th>
    <th>输入串</th>
    <th>动作说明</th>
  </tr>`

  let processElement = document.getElementById('process');
  let statusStack = [0];
  let signStack = ['#'];
  let pos = 0;
  let flag = true;
  let description = '';
  let step = 1;
  lang += '#';

  while(flag){
    processHTML += `<tr><td>${step}</td>
    <td>${statusStack.join(' ')}</td>
    <td>${signStack.join(' ')}</td>
    <td>${lang.substring(pos)}</td>`
    if(!ACTION[statusStack[statusStack.length-1]][lang[pos]]){  // 不存在
      description = `ACTION(${statusStack[statusStack.length-1]}, ${lang[pos]}) == err, 该语言不符合该文法`;
      flag = false;
    }else if (ACTION[statusStack[statusStack.length-1]][lang[pos]][0] == 's') { // 入栈
      description = `ACTION(${statusStack[statusStack.length-1]}, ${lang[pos][0]})=${ACTION[statusStack[statusStack.length-1]][lang[pos]]}`
      statusStack.push(ACTION[statusStack[statusStack.length-1]][lang[pos]].substring(1))
      signStack.push(lang[pos])
      pos += 1;
      description += `状态${statusStack[statusStack.length-1]}入栈`
    }else if(ACTION[statusStack[statusStack.length-1]][lang[pos]][0] == 'r'){  // 规约
      r = ACTION[statusStack[statusStack.length-1]][lang[pos]][1];
      description = `${ACTION[statusStack[statusStack.length-1]][lang[pos]]}:`
      for(let i in grammar[r]['value']){  // 根据文法长度规约
        signStack.pop();
        statusStack.pop();
      }
      description += `
      用${grammar[r]['key']}->${grammar[r]['value']}规约
      且GOTO(${statusStack[statusStack.length -1]}, ${grammar[r]['key']})`

      signStack.push(grammar[r]['key']);
      statusStack.push(GOTO[statusStack[statusStack.length-1]][grammar[r]['key']]);

      description += `状态${statusStack[statusStack.length - 1]}入栈`;
    }else if(ACTION[statusStack[statusStack.length-1]][lang[pos]] == 'acc'){
      flag = false;  // 分析成功
      description = 'acc: 分析成功';
    }
    processHTML += `
    <td>${description}</td></tr>`
    step += 1;
  }

  processElement.innerHTML = processHTML;

}



// 显示SLR(1)分析表
function showSLRSheet(){
  sheetElement = document.getElementById('sheet')
  terminalSymbols = Array.from(terminalSymbols);
  unterminalSymbols = Array.from(unterminalSymbols);
  terminalSymbols.push('#');

  tempter = {}  // 方便生成分析 表
  for(let t in terminalSymbols){
    tempter[terminalSymbols[t]] = t;
  }
  tempunter = {}
  for (let u in unterminalSymbols) {
    tempunter[unterminalSymbols[u]] = u;
  }


  sheetHTML = `
    <tr>
      <th rowspan="2">状态</th>
      <th colspan="${terminalSymbols.length}">ACTION</th>
      <th colspan="${unterminalSymbols.length}">GOTO</th>
    </tr>
  `
  sheetHTML += '<tr>';
  for(let t of terminalSymbols){
    sheetHTML += `<th>${t}</th>`
  }
  for(let u of unterminalSymbols){
    sheetHTML += `<th>${u}</th>`
  }
  sheetHTML += '</tr>';

  for(let i = 0; i < ACTION.length; i++){
    sheetHTML += '<tr>'
    sheetHTML += `<td>${i}</td>`
    for(let t of terminalSymbols){
      sheetHTML += `<td>${ACTION[i][t]?ACTION[i][t]:' '}</td>`
    }
    for(let u of unterminalSymbols){
      sheetHTML += `<td>${GOTO[i][u]?GOTO[i][u]:' '}</td>`
    }
    sheetHTML += '</tr>'
  }

  sheetElement.innerHTML = sheetHTML;
}

function genACTIONGOTO() {
  for(let index in itemfamily){
    ACTION[index] = {};
    GOTO[index] = {};
    for(let item of itemfamily[index]){
      if(item['dot'] == item['value'].length){
        if(item['key'] == 'S\''){
          ACTION[index]['#'] = 'acc'
          continue;
        }
        for(let f of follow[item['key']]){
          let toIndex = findgrammar(item['key'], item['value'])
          ACTION[index][f] = 'r' + toIndex;
        }
      }else if(!isUpper(item['value'][item['dot']])){
        for(let toIndex in goMap[index]){
          if(goMap[index][toIndex] == item['value'][item['dot']]){
            ACTION[index][item['value'][item['dot']]] = 's'+toIndex;
          }
        }
      }else if(isUpper(item['value'][item['dot']])){
        for(let toIndex in goMap[index]){
          if(goMap[index][toIndex] == item['value'][item['dot']]){
            GOTO[index][item['value'][item['dot']]] = toIndex;
          }
        }
      }
    }
  }
  console.log('ACTION:', ACTION);
  console.log('GOTO:', GOTO);
}


function findgrammar(key, value) {
  for(let i in grammar){
    if(grammar[i]['key'] == key && grammar[i]['value'] == value){
      return i;
    }
  }
}

// 显示FIRST集
function showFIRST(){
  let firstHTML = '';
  firstElement = document.getElementById('first');
  for(let k in first){
    firstHTML += `<tr>
    <td>${k}</td>
    <td>{${first[k].join(',')}}</td>
    </tr>`
  }

  firstElement.innerHTML = firstHTML;
}

// 显示FOLLOW集
function showFOLLOW(){
  let followHTML = '';
  followElement = document.getElementById('follow');
  for(let k in follow){
    followHTML += `
    <tr>
      <td>${k}</td>
      <td>{${follow[k].join(',')}}</td>
    </tr>
    `
  }
  followElement.innerHTML = followHTML;
}

function handleFIRST(){
  first['S\''] = [];
  for(let sign of unterminalSymbols){
    first[sign] = []
  }
  let flag = true;
  while(flag){
    flag = false;
    for(let g of grammar){
      let pos = 0;
      while(pos < g['value'].length){
        if(isUpper(g['value'][pos])){  // A->·BC, 把FIRST(B)加入FIRST(A)
          for(let f of first[g['value'][pos]]){
            if(!first[g['key']].includes(f) && f != 'e'){
              first[g['key']].push(f);
              flag = true;
            }
          }
          if(first[g['value'][pos]].includes('e')){  // FIRST(B)包含epsilon,则把看C
            pos += 1;
          }else{
            break;
          }
        }else{  // A->a, 把a加入到FIRST(A)
          if(!first[g['key']].includes(g['value'][pos])){
            first[g['key']].push(g['value'][pos]);
            flag = true;
          }
          break;
        }
      }
    }
  }

  console.log(first);
}

function handleFOLLOW(){
  follow['S\''] = ['#'];
  for(let sign of unterminalSymbols){
    follow[sign] = []
  }
  let flag  = true;
  while(flag){
    flag = false;
    for(g of grammar){
      let pos = 0;  // 找到非终结符
      let ppos= 0;  // 找到非终结符后的其他终结符
      while(pos < g['value'].length){  //
        if(isUpper(g['value'][pos])){
          ppos = pos+1;
          if(ppos == g['value'].length){
            for(let f of follow[g['key']]){
              if(!follow[g['value'][pos]].includes(f)){
                follow[g['value'][pos]].push(f);
                flag = true;
              }
            }
            break;
          }
          while(ppos < g['value'].length){
            if(isUpper(g['value'][ppos])){
              for(let f of first[g['value'][ppos]]){
                if(!follow[g['value'][pos]].includes(f) && f != 'e'){
                  follow[g['value'][pos]].push(f);
                  flag = true;
                }
              }
              if(first[g['value'][ppos]].includes('e')){
                ppos += 1;
              }else{
                pos += 1;
                break;
              }
            }else{
              if(!follow[g['value'][pos]].includes(g['value'][ppos])){
                follow[g['value'][pos]].push(g['value'][ppos]);
                flag = true;
              }
              pos += 1;
              break;
            }

            if(ppos == g['value'].length){  // A->αB 或  A->αBβ 且 β=>e
              for(let f of follow[g['key']]){
                if(!follow[g['value'][pos]].includes(f)){
                  follow[g['value'][pos]].push(f);
                  flag = true;
                }
              }
            }
          }
        }else{
          pos += 1;
        }
      }
    }
  }
  console.log(follow);
}

function collectSign(){  // 收集所有的终结符和非终结符
  for(let g of grammar){
    for(let c of g['value']){
      if(isUpper(c)){
        unterminalSymbols.add(c);
      }else{
        terminalSymbols.add(c);
      }
    }
  }
  console.log('terminalSymbols', terminalSymbols);
  console.log('unterminalSymbols', unterminalSymbols);
}
// 显示项目集规范族的DFA图像
function showDFA(){
  console.log('showDFA');
  let dfa = document.querySelector('#mermaid');
  dfa.innerHTML = ''
  let insertSvg = function(svgCode, bindFunctions){
    dfa.innerHTML = svgCode;
  }
  let graphDefinition = 'graph LR\n';
  for(let i = 0; i < itemfamily.length; i++){  // 定义规范族
    graphDefinition += 'I'+i+'["I'+i+':';
    for(let item of itemfamily[i]){
      graphDefinition += itemSetToString(item) +'</br>'
    }
    graphDefinition += '"]\n'
  }

  for(let i = 0; i < goMap.length; i++){  // 定义规范族之间的关系
    for(let j = 0; j < goMap[i].length; j++){
      if(goMap[i][j] != null){
        graphDefinition += `I${i}--"${goMap[i][j]}"-->I${j}\n`;
      }
    }
  }
  console.log(graphDefinition);
  let graph = mermaidAPI.render('graphDiv', graphDefinition, insertSvg);

}


function go(index, sign){
  if(typeof(sign) == 'undefined'){
    return null;
  }
  items = itemfamily[index];
  from  = [];   // 满足go函数的项目集合
  for(let item of items){
    if(item['value'][item['dot']] == sign){
      from.push({key:item['key'], value: item['value'], dot: item['dot']+1});
    }
  }

  return closure(from);
}

// 生成项目集规范族
function genItemFamily(){
  for(let i = 0; i < itemfamily.length; i++){
    let front = [];
    for(let item of itemfamily[i]){
      front.push(item['value'][item['dot']]);  // 活前缀
    }
    goMap[i] = [];
    for(let sign of front){  // 生成新的规范族
      newItem = go(i, sign);
      if(newItem == null){
        continue;
      }
      same = itemfamilyEqual(newItem);
      if(same == -1){  // 如果不存在相同的规范族
        itemfamily.push(newItem);
        goMap[i][itemfamily.length-1] = sign;
      }else{  // 已存在相同的规范族
        goMap[i][same] =  sign;
      }
    }
  }
}

function itemfamilyEqual(item1){  // 规范族去重

  for(let j = 0; j < itemfamily.length; j++){
    let flag = true;
    if(itemfamily[j].length != item1.length){
      continue;
    }
    for(let i = 0; i < item1.length; i++){
      if(!itemsInclude(itemfamily[j], item1[i])){  // 出现了不包含的情况
        flag = false;
      }
    }
    if(flag == true){
      return j;
    }
  }
  return -1;
}

function itemsInclude(items, item){  // 项目集中包含某个项目
  for(let i of items){
    if(item['key'] == i['key'] && item['value'] == i['value'] && item['dot'] == i['dot']){
      return true;
    }
  }
  return false;
}

function closure(item){  // 求闭包
  let result = [];  // 闭包结果集
  for(i of item){  // 先把初始值放入集合
    result.push(i);
  }
  // 对集合中的每一个添加新的元素
  // (如果有新的元素加入，那么result.length也增加， 即可保证最后结果是不在增加的
  for(let i = 0; i < result.length; i++){  
    item = result[i];
    if(!isUpper(item['value'][item['dot']])){ // A->·ab 的情况，不用管
      continue;
    }
    for(let j = 0; j < itemSet.length; j++){  // 发现S->·A 找到项目集中的A->·ab并插入闭包结果集
      if(itemSet[j]['key'] == item['value'][item['dot']] && itemSet[j]['dot'] == 0 && 
      !itemsInclude(result, itemSet[j])){  // 判断闭包结果集中是否已经存在该项目
        result.push(itemSet[j]);
      }
    }
  }

  return result;
}

function grammarToString(gramm){
  return `${gramm['key']}->${gramm['value']}`;
}

function itemSetToString(item){
  dd = item['value'].substring(0,item['dot'])+'·'+item['value'].substring(item['dot']);
  return `${item['key']}->${dd}`
}

function addLog(str){
  log += str + '\n'
}
function showLog(){  // 简单的日志显示

}

function isUpper(word){  // 是否是终结符
  const regex = /^[A-Z]$/;
  return regex.test(word);
}


function genGrammar(str){  // 把文法字符串转换成类似结构{'S': 'aBc'}
  console.log(str);
  let temp = str.split('->');

  if(temp.length !== 2){
    console.error('文法有错:', str);
    log += '文法有错:' + str
    return null;
  }

  if(temp[0].length != 1){
    console.error('文法有错', str);
    log += '文法有错:' + str
    return null;
  }

  if(temp[1].split('|') != 1){  // 处理 | 的情况
    temp = temp.concat(temp[1].split('|'));
    temp.splice(1,1);
  }

  subGrammar = [];

  for(let i = 1; i < temp.length; i++){
    p = {key: temp[0].trim(), value: temp[i].trim(), dot: 0};
    subGrammar.push(p);
  }
  return subGrammar;
}
