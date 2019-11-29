namespace main {
    /** Connection */
    export class Connection {
        /** 实际的socket.io连接 */
        protected _connection: any
        /** 本连接所在的服务器 */
        protected server: Server
        public id: string
        /** 关闭连接的回调函数 */
        protected close_callback: () => void
        /** 监听消息的回调函数 */
        protected listen_callback: any

        constructor(id: string, connection: any, server: Server) {
            this._connection = connection
            this.server = server
            this.id = id
        }

        /** 当连接关闭 */
        onClose(callback: any) {
            this.close_callback = callback
        }

        /** 当有客户端的消息 */
        listen(callback: any) {
            this.listen_callback = callback
        }

        /** 广播消息 */
        broadcast(message: any) { }

        /** 发送消息 */
        send(message: any) { }

        /** 发送UTF8字符串 */
        sendUTF8(data: string) { }

        /** 关闭连接 */
        close(logError: string) {
            console.log("正在关闭 连接 to " + this._connection.remoteAddress + ". 异常: " + logError)
            this._connection.close()
        }
    }
}