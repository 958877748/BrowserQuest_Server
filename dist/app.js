//node内置模块
fs = require('fs')

//node内置模块
http = require('http')

//express模块需安装,npm i -D express
app = require('express')

//socket.io模块需安装,npm i -D socket.io
socketIO = require('socket.io')

//underscore模块需安装,npm i -D underscore
_ = require('underscore')

//sanitizer模块需安装,npm i -D sanitizer
sanitizer = require('sanitizer')

//memcache模块需要events.EventEmitter,在process.EventEmitter上
process.EventEmitter = require('events').EventEmitter

//memcache模块需安装,npm i -D memcache
memcache = require('memcache')

//启动ts编译后的js
require('./bundle').main.main()