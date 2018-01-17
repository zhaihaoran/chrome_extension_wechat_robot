'use strict';
import 'babel-polyfill';
import Wechat from 'wechat4u';
import contact from '_wechat4u@0.7.6@wechat4u/lib/interface/contact';
import idb from './util/idb';
import CONF from './util/conf';
// let idb = require('');
// let CONF = require('./util/conf');

class WxBot extends Wechat {
    constructor(data) {
        super(data);
        this.auto_captrue_quan = false; // 是否开始自动采集消息
        this.auto_send = false; // 是否开始自动群发
        this.send_message = ''; // 群发消息内容
        this.groups = [];
        this.ava_contacts = [];
        this.quan_count = 0; // 采集消息的数量

        this.initDB(); // 初始化数据库
        this.on('login', () => {
            this.on('message', msg => {
                /**
                 * 获取消息时间
                 */
                console.log(`----------${msg.getDisplayTime()}----------`);
                /**
                 * 获取消息发送者的显示名
                 */
                console.log(
                    this.contacts[msg.FromUserName].getDisplayName() +
                    '发来消息:'
                );
                /**
                 * 判断消息类型
                 */
                switch (msg.MsgType) {
                    case this.CONF.MSGTYPE_TEXT:
                        /**
                         * 文本消息
                         */
                        console.log(msg.Content);
                        // this._botReply(msg)
                }
            });
            this.on('contacts-updated', contacts => {
                this._updateContact();
            });
        });
    }

    /* 
    初始化数据库
    @method
  */
    initDB() {
        const DB_NAME = 'wxbot-chrome-extension';
        const DB_VERSION = this.getDBVersion();
        // 初始化indexedDB
        idb
            .initDb(DB_NAME, DB_VERSION)
            .then(db => {
                // 获取消息数量
                idb.getCount(CONF.STORE_NAME.TOTAL).then(
                    count => {
                        console.debug('获取到消息数量:', count);
                        return (this.quan_count = count);
                    },
                    reason => {
                        throw reason;
                    }
                );
            })
            .catch(err => {
                throw err;
            });
    }
    /* 
    获取数据库版本号
    @method
    @return {integer} 数据库版本号
  */
    getDBVersion() {
        let date_str = new Date().toLocaleDateString();
        if (localStorage.captrue_date != date_str) {
            let old_version = +(localStorage.db_version || 1);
            let new_version = old_version + 1;
            localStorage.captrue_date = date_str;
            localStorage.db_version = new_version; // 存储db version
            localStorage.quan_page = 0; //表示目前采集0页
            localStorage.sended_quan_count = 0; //表示已经发送消息数量
            return new_version;
        } else {
            return localStorage.db_version;
        }
    }
    /*
     * 更新微信群
     */
    _updateContact() {
        let contacts_list = [];
        for (let key in this.contacts) {
            contacts_list.push(this.contacts[key]);
        }
        this.ava_contacts = contacts_list.filter(
            contact => contact.NickName && contact.UserName.indexOf('@@') === -1
        );
        this.groups = contacts_list.filter(
            contact => contact.NickName && contact.UserName.indexOf('@@') != -1
        );
        this.updateGroups();
    }

    _tuning(word) {
        let params = {
            key: 'a2e961f3496f4f6eace7d6c95fb3e393',
            info: word
        };
        return this.request({
                method: 'GET',
                url: 'http://www.tuling123.com/openapi/api',
                params: params
            })
            .then(res => {
                const data = res.data;
                if (data.code == 100000) {
                    return data.text + '[图灵机器人]';
                }
                throw new Error('tuning返回值code错误', data);
            })
            .catch(err => {
                console.log(err);
                return '现在思路很乱，最好联系下我哥 T_T...';
            });
    }

    _botReply(msg) {
        if (msg['Content']) {
            this._tuning(msg['Content']).then(reply => {
                this.sendMsg(reply, msg['FromUserName']);
                console.log(reply);
            });
        }
    }

    /* 
    @method 开启自动群发消息
  */
    _startAutoSend(time_span = 20, message) {
        console.log('发送时间间隔', time_span);
        var _this = this;
        _this.auto_send = true;

        this.groups.forEach(group => {
            if (group.Checked) {
                group.MemberList.forEach((user, i) => {
                    setTimeout(function() {
                        console.log(i);
                        // console.log('发送给 ', user.UserName);
                        _this.sendMsg(message, user.UserName).catch(err => {
                            _this.emit('error', err);
                        });
                    }, 1000 * i * time_span);
                });
            }
        });
    }

    /* 
    @method 暂停群发
  */
    _stopAutoSend() {
        this.auto_send = false;
    }
    /*
     *  @method 更新微信群属性：是否群发
     */
    updateGroups() {
        if (localStorage.checkedGroup) {
            let checkedGroup = JSON.parse(localStorage.checkedGroup);
            let arr = Object.keys(checkedGroup);
            this.groups.forEach(group => {
                let key = encodeURI(group.NickName);
                if (arr.includes(key)) {
                    group.Checked = true;
                }
            });
        }
    }
}

let bot = null;

window.getBot = () => {
    let prop = null;
    if (!bot) {
        if (localStorage.reloginProp) {
            prop = JSON.parse(localStorage.reloginProp);
        }
        bot = new WxBot(prop);
    }
    return bot;
};
window.newBot = () => {
    bot = null;
    return window.getBot();
};
window.getWxState = () => {
    return Wechat.STATE;
};