declare namespace fs{
    export function lstatSync(filepath:any)
    /** 异步读取文件的全部内容。 */
    export function readFile(路径: string , 编码: string , 回调函数: (异常: any, 文件数据: any) => void): void;
    /** 异步读取文件的全部内容。 */
    export function readFile(路径: string , 回调函数: (异常: any, 文件数据: any) => void): void;
}
declare var http:any
declare var app:any
declare var socketIO:any
declare var _:any
declare var sanitizer:any
/** 分布式的高速缓存系统 */
declare namespace memcache{
    export class Client{}
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