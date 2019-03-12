import { socketIOServer } from './ws';
import { readFile } from 'fs';
import { 世界服务器 } from './worldserver';
import * as _ from 'underscore'
import { Metrics } from './metrics';
import { Player } from './player';
function main(config: 配置) {
    let 服务器 = new socketIOServer(config.host, config.port)
    let lastTotalPlayers:number = 0
    let worlds = []
    let metrics = config.metrics_enabled ? new Metrics(config) : null;
    // let checkPopulationInterval = setInterval(function() {
    //     if(metrics && metrics.isReady) {
    //         metrics.getTotalPlayers(function(totalPlayers) {
    //             if(totalPlayers !== lastTotalPlayers) {
    //                 lastTotalPlayers = totalPlayers;
    //                 _.each(worlds, function(world) {
    //                     world.updatePopulation(totalPlayers);
    //                 });
    //             }
    //         });
    //     }
    // }, 1000);
    console.log("开始 BrowserQuest 游戏服务器...",世界服务器)

    服务器.监听连接((新连接)=>{
        var world, // 在其中, 玩家将生成
            connect = function() {
                if(world) {
                    world.connect_callback(new Player(新连接, world));
                }
            };
        
        if(metrics) {
            metrics.getOpenWorldCount(function(open_world_count) {
                // choose the least populated world among open worlds
                world = _.min(_.first(worlds, open_world_count), function(w) { return w.playerCount; });
                connect();
            });
        }
        else {
            // simply fill each world sequentially until they are full
            world = _.detect(worlds, function(world) {
                return world.playerCount < config.nb_players_per_world;
            });
            world.updatePopulation();
            connect();
        }
    })
}

function 获取世界分布(worlds: Array<any>) {
    let 分布 = []
    for (let index = 0; index < worlds.length; index++) {
        const world = worlds[index]
        分布.push(world.playerCount)
    }
    return 分布
}

function 获取配置文件(路径: string, 回调函数: (JSON数据: 配置) => void) {
    readFile(路径, 'utf8', function (异常, JSON数据) {
        if (异常) {
            console.error("无法打开配置文件:", 异常.path);
            回调函数(null)
        } else {
            回调函数(JSON.parse(JSON数据))
        }
    })
}

interface 配置{
    /** IP */
    host:string,
    /** 端口号 */
    port:number,
    /** 调试等级 */
    debug_level:string,
    /** 每个世界的玩家数量上限 */
    nb_players_per_world:number
    /** 世界数量上限 */
    nb_worlds:number,
    /** 地图文件路径 */
    map_filepath:string,
    metrics_enabled:boolean
}

let 默认配置路径 = './server/config.json'
let 自定义配置路径 = './server/config_local.json'

//这个好像是拿到启动时所带的参数
process.argv.forEach(function (val, index, array) {
    if (index === 2) {
        自定义配置路径 = val
    }
})


获取配置文件(默认配置路径, function (默认配置) {
    获取配置文件(自定义配置路径, function (本地配置) {
        if (本地配置) {
            main(本地配置)
        } else if (默认配置) {
            main(默认配置)
        } else {
            console.error("服务器无法在没有任何配置文件的情况下启动。");
            process.exit(1);
        }
    })
})