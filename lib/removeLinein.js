/**
 * 该方法只针对单行的字符串进行去除注释的操作
 * @param {string} str 目标字符串
 */
module.exports = function (str, options) {
  var status = {
    singleQuote: false, // 单引号
    doubleQuote: false, // 双引号
    backQuote: false, // `号
    regex: false, // 正则
    blockComment: false, // 块注释 /* */
    lineComment: false, // 行注释 //
    specialComment: false // 特殊注释
  }
  var isTransfer = function (prev, prevv) {
    if (!prev) {
      return false;
    }
    if (prev === '\\') {
      if (!prevv) {
        return true;
      }
      if (prevv === '\\') {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }
  var start, removeList = [];
  if (!str) {
    return '';
  }
  for (var i = 0, count = str.length; i < count; i++) {
    var cur = str[i];
    var prev, prevv, next, nextt;
    if (i > 0) {
      prev = str[i - 1];
    }
    if (i < count) {
      next = str[i + 1];
    }
    if (i < count - 1) {
      nextt = str[i + 2];
    }
    if (i > 1) {
      prevv = str[i - 2];
    }

    // 如果是正则，则遇除非遇到正则右侧边界，否则直接过。
    // if (status.regex) {
    //   if (cur === '/' && prev && prev !== '\\') {
    //     status.regex = false;
    //   }
    //   continue;
    // }
    
    // 如果是单引号字符串，则除非遇到字符串右侧边界，否则直接过
    if (status.singleQuote) {
      if (cur === "'" && !isTransfer(prev, prevv)) {
        status.singleQuote = false;
      }
      continue;
    }

    // 如果是双引号字符串，则除非遇到字符串右侧边界，否则直接过
    if (status.doubleQuote) {
      if (cur === '"' && !isTransfer(prev, prevv)) {
        status.doubleQuote = false;
      }
      continue;
    }

    // 如果是es6中的`，则除非遇到右侧边界，否则直接过
    if (status.backQuote) {
      if (cur === '`' && !isTransfer(prev, prevv)) {
        status.backQuote = false;
      }
      continue;
    }

    // block comment，后面可能还有代码
    if (status.blockComment || status.specialComment) {
      if (cur === '/' && prev && prev === '*') {
        if (status.blockComment || (status.specialComment && !options.keepSpecialComments)) {
          removeList.push({
            start: start,
            end: i
          });
          delete start;
        }

        if (status.specialComment) {
          status.specialComment = false;
        } else {
          status.blockComment = false;
        }
      }
      continue;
    }

    if (cur === '"' && !isTransfer(prev, prevv)) {
      status.doubleQuote = true;
    }
    if (cur === "'" && !isTransfer(prev, prevv)) {
      status.singleQuote = true;
    }
    if (cur === '`' && !isTransfer(prev, prevv)) {
      status.backQuote = true;
    }

    // 如果所有的状态都是正常状态，则最后判定当前是否是注释。
    if (cur === '/' && !isTransfer(prev, prevv)) {
      if (next && nextt && next === '*' && (nextt === '#' || nextt === '!')) {
        status.specialComment = true;
        start = i;
        continue;
      }
      if (next && next === '*') {
        status.blockComment = true;
        start = i;
        continue;
      }
      if (next && next === '/') {
        // 如果是css，则//是不合法的，因此//只可能是img图片等路径。
        if (!options.isCssLinein) {
          // 如果不是css，行注释不需要再往后判定了，直接删除到最后
          status.lineComment = true;
          removeList.push({
            start: i,
            end: str.length - 1
          });
          break;
        }
      }
    }
  }
  
  if (removeList && removeList.length) {
    for (var i = removeList.length - 1; i >= 0; i--) {
      var remove = removeList[i]
      var head = str.substring(0, remove.start);
      var tail = str.substring(remove.end + 1);
      str = head + tail;
    }
  }

  return str;
}