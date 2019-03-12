namespace main{
    export function main() {
        let 服务器配置文件路径 = 'config.json'
        fs.readFile(服务器配置文件路径, 'utf8', function (异常, JSON数据) {
            if (异常) {
                console.error("无法打开配置文件:", 异常.path);
            } else {
                let 服务器配置:配置 = JSON.parse(JSON数据)
            }
        })
        
    }
}

function 获取世界分布(worlds: Array<any>) {
    let 分布 = []
    for (let index = 0; index < worlds.length; index++) {
        const world = worlds[index]
        分布.push(world.playerCount)
    }
    return 分布
}

//将main命名空间引用置于exports上
var exports;
exports.main = main;