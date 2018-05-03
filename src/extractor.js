const path = require("path");
const fs = require("fs");

const params = process.argv.slice(2);
const solRegex = /\.sol$/g;

console.log("params-----------------------------------------------\n", params);
const contractPath = path.resolve(process.cwd(), params[0]);
console.log(contractPath);

let source;
if (contractPath.match(solRegex) && fs.existsSync(contractPath)) {
  source = fs.readFileSync(contractPath, "utf8");
  const stat = fs.statSync(contractPath);
  // console.log('stat-----------------------------------------------\n', stat);
  // console.log('source---------------------------------------------\n', source);
} else {
  throw new Error("Path does not exist");
}

const optimizer = str => {
  const arr = str.trim().split("\n");
  const beforeConstruct = str
    .substr(0, str.indexOf("constructor"))
    .trim()
		.split("\n");
	const afterConstruct = str.substr(str.indexOf('constructor'));
  let full = [];
  let others = [];
  const structs = [];
  let structName = "";
  let structFull = [];
  let structOthers = [];
  let inStruct = false;
  beforeConstruct.forEach(el => {
    el = el.trim();
    if (el.match(/^(struct).*/g) !== null) {
      inStruct = true;
      structName = el;
    } else if (el.match(/^[\}]/g) !== null && inStruct === true) {
      inStruct = false;
      structs.push(
        '\t',structName,'\n',
				'\t\t',optimizerOthers(structOthers).join('\n\t\t'),'\n',
				'\t\t',optimizerFull(structFull).join('\n\t\t'),'\n',
				'\t','}',
				'\n'
      );
      structName = "";
      structFull = [];
      structOthers = [];
    }
    if (inStruct === false) {
      if (
        el.match(
          /^(\d|\w*\[\])|^(bytes32)|^(uint256)|^(mapping)|^(int256)|^(int+\s)|^(uint+\s)|^(string+\s)|^(bytes+\s)/gm
        ) !== null
      ) {
        full.push(el);
      } else if (
        el.match(
          /^(uint\S*\b)|^(bytes\S*\b)|^(int\S*\b)|^(address)|^(bool)/gm
        ) !== null
      ) {
        others.push(el);
      }
    } else {
      if (
        el.match(
          /^(\d|\w*\[\])|^(bytes32)|^(uint256)|^(mapping)|^(int256)|^(int+\s)|^(uint+\s)|^(string+\s)|^(bytes+\s)/gm
        ) !== null
      ) {
        structFull.push(el);
      } else if (
        el.match(
          /^(uint\S*\b)|^(bytes\S*\b)|^(int\S*\b)|^(address)|^(bool)/gm
        ) !== null
      ) {
        structOthers.push(el);
      }
    }
  });
  others = optimizerOthers(others);
  full = optimizerFull(full);

  return [beforeConstruct.slice(0,3).join('\n')+'\n', structs.join('')+'\n',others.join('\n\t')+'\n\t',full.join('\n\t'),'\n\n'+afterConstruct].join('');
};

const optimizerFull = arr => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].match(/uint.*\b/g) !== null) {
			const tmp = arr.splice(i, 1);
      arr.unshift(tmp);
      
    }
  }
  return arr;
};

const optimizerOthers = arr => {
  const result = [];
  let orgArr = [];
  let byteSize = 0;
  let memory = 0;
  arr.forEach(el => {
    if (el.indexOf("uint") >= 0) {
      byteSize = parseInt(/uint(\d+)/gm.exec(el)[1]) / 8;
      orgArr.push([el, byteSize]);
    } else if (el.indexOf("int") >= 0) {
      byteSize = parseInt(/int(\d+)/gm.exec(el)[1]) / 8;
      orgArr.push([el, byteSize]);
    } else if (el.indexOf("bytes") >= 0) {
      byteSize = parseInt(/bytes(\d+)/gm.exec(el)[1]);
      orgArr.push([el, byteSize]);
    } else if (el.indexOf("address") >= 0) {
      orgArr.push([el, 20]);
    } else if (el.indexOf("bool") >= 0) {
      orgArr.push([el, 1]);
    }
  });
  orgArr.sort((a, b) => {
    return a[1] - b[1];
  });
  while (orgArr.length > 0) {
    if (memory === 0) {
      for (let i = 0; i < orgArr.length; i++) {
        if (orgArr[i][0].indexOf("int") >= 0 && orgArr[i][1] < 12) {
          result.push(orgArr[i][0]);
          memory += orgArr[i][1];
          orgArr = [...orgArr.slice(0, i), ...orgArr.slice(i + 1)];
        }
			}
			if(memory === 0) {
				result.push(orgArr[0][0]);
				memory += orgArr[0][1];
				orgArr.shift();
			}
    } else {
      for (let i = orgArr.length - 1; i >= 0; i--) {
        if (orgArr[i][1] + memory < 32) {
          result.push(orgArr[i][0]);
          memory += orgArr[i][1];
          orgArr = [...orgArr.slice(0, i), ...orgArr.slice(i + 1)];
        }
      }
      memory = 0;
    }
  }
  return result;
};


module.exports = source;
