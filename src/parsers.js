const os = require('os');
const homeDirectory = os.homedir();
const isWin = os.platform()=='win32';
const normalize = require('path').normalize;

function untildify(path){
    return homeDirectory ? path.replace(/^~(?=$|\/|\\)/, homeDirectory) : path;
}

function parseArray(value){
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof(value) === "string") return value.split("\n").map(line=>line.trim()).filter(line=>line);
    throw "Unsupprted array format";
}

module.exports = {
    boolean : (value) =>{
        if (!value || value === "false") return false;
        return true;
    },
    text : (value) =>{
        if (value)
            return value.split('\n');
        return undefined;
    },
    number: (value)=>{
        if (!value) return undefined;
        const parsed = parseInt(value);
        if (parsed === NaN) {
            throw `Value ${value} is not a valid number`
        }
        return parsed;
    },
    autocomplete: (value, getVal)=>{
        if (!value) return undefined;
        if (typeof(value) == "object") return (getVal ? value.value : value.id) || value;
        return value;
    },
    autocompleteOrArray: (value)=>{
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof(value) == "object") return [value.id || value];
        return [value];
    },
    object: (value)=>{
        if (!value) return undefined;
        if (typeof(value) === "object") return value;
        if (typeof(value) === "string") {
            const obj = {};
            value.split("\n").map(line=>{
                var [key, ...value] = line.split("=");
                if (!value.length) throw "Unsupported object format";
                key = key.trim();
                value = value.join("=").trim();
                if (!key || !value) throw "Empty key or value in string:\n"+value;
                obj[key] = value;
            })
            return obj;
        }
        throw `Value ${value} is not an object`;
    },
    string: (value)=>{
        if (!value) return undefined;
        if (typeof(value) === "string") return value.trim();
        throw `Value ${value} is not a valid string`;
    },
    path: (value)=>{
        if (!value) return undefined;
        let path = module.exports.string(value);
        if (isWin) path = path.replace(/\//g, '\\');
        else path = path.replace(/\\/g, '/');
        return normalize(untildify(path));
    },
    array: parseArray
}