/**
 * Чтение настроек из файла конфигурации
 * @file modules/conf.js
 * @project skr-rpc-service
 * @author Aleksandr Krasnov
 */

import argsParser from "args-parser"
import fs from "fs";
import { join } from "path";

var args = argsParser(process.argv);
var pth = join;

class Configuration {
    configValues = null;
    rootDir = null;

    constructor(rootDir) {
        this.rootDir = rootDir;

        // настройки не читаем дважды
        if(this.configValues)
            return this.configValues;

        var confPath = args.conf;

        this.next('./default.conf');

        if(confPath) {
            this.next(confPath);
        }

        this.configValues = args;
    }

    next(confPath) {
        if(confPath.indexOf('./') == 0) {
            confPath = pth(this.rootDir, confPath);
        }

        // если файла нет, то читаем то что передали в параметрах команды
        if(confPath && fs.existsSync(confPath)) {
            var txt = fs.readFileSync(confPath).toString();
            if(txt) {
                var lines = txt.split('\n');
                for(var i = 0; i < lines.length; i++) {
                    var line = lines[i].replace(/\n/g, '').replace(/\r/g, '');

                    if(line.startsWith('#')) {
                        continue;
                    }

                    var data = line.split('=');
                    if(data[1]) {
                       var value = data[1].trim().toLowerCase();
                       if(value.indexOf('#') > 0) {
                           value = value.substr(0, value.indexOf('#') - 1);
                       }
                       var key = data[0].trim().toLowerCase();
   
                       if(value.indexOf('"') == 0) {
                           args[key] = data[1].trim().replace(/\"/g, '');
                       } else if(value == 'true' || value == 'false') {
                           args[key] = value == 'true';
                       } else {
                           args[key] = parseFloat(value);
                       }
                   }
                }
            }
        }
    }

    get args() {
        return this.configValues;
    }
}

export default Configuration;