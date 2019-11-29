namespace main {
    /** 服务器 */
    export class Server {
        /** 端口号 */
        public port: number
        /** 所有连接 */
        private connections: any = {}
        /** 计数器 */
        protected counter: number = 0
        /** 异常回调函数 */
        protected error_callback: () => void
        /** 连接回调函数 */
        protected connection_callback: (connection: SocketIOConnection) => void

        constructor(port: number) {
            this.port = port
        }

        /** 监听有玩家连接上服务器 */
        public onConnect(callback: (connection: SocketIOConnection) => void) {
            this.connection_callback = callback
        }

        /** 监听异常 */
        public onError(callback: () => void) {
            this.error_callback = callback
        }

        /** 广播消息 */
        protected broadcast(message: any) { }

        /** 循环所有连接 */
        public forEachConnection(callback: (connection:any)=>void) {
            let object = this.connections
            for (const key in object) {
                if (object.hasOwnProperty(key)) {
                    const connection = object[key]
                    callback(connection)
                }
            }
        }

        /** 添加一个连接 */
        public addConnection(connection: any) {
            this.connections[connection.id] = connection
        }

        /** 删除一个连接 */
        public removeConnection(id: string) {
            delete this.connections[id]
        }

        /** 获取一个连接 */
        public getConnection(id: string) {
            return this.connections[id]
        }

        /** 获取连接数量 */
        public connectionsCount() {
            return Object.keys(this.connections).length
        }
    }
}