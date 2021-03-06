'use strict';
import 'babel-polyfill';
import Vue from 'vue';
window.Vue = Vue;
let bg_window = null;
let bot = null;
var $vm = (window.$vm = new Vue({
    el: '#app',
    data: {
        page: '',
        auto_send_text: '开始群发消息',
        contacts: [],
        groups: [],
        quan_count: 0,
        filterName: '',
        send_message: '',
        sended_quan_count: localStorage.sended_quan_count || 0,
        max_quan_page: localStorage.max_quan_page || 2, //默认采集前6页数据
        auto_send_time_span: localStorage.auto_send_time_span || 30 //自动发送消息间隔,单位秒
    },
    methods: {
        initData() {
            if (bot.auto_send) {
                this.auto_send_text = '暂停群发消息';
            }
            if (!localStorage.auto_send_time_span) {
                localStorage.auto_send_time_span = 20;
            }
            this.quan_count = bot.quan_count; // 更新消息数量
        },
        keyupHandler(e) {
            let elem = e.target;
            if (elem.id) {
                switch (elem.id) {
                    case 'auto-send-time-span':
                        if (!isNaN(parseInt(elem.value))) {
                            this.auto_send_time_span = parseInt(elem.value);
                            localStorage.auto_send_time_span = parseInt(
                                elem.value
                            );
                        }
                        break;
                    case 'max-quan-page':
                        if (!isNaN(parseInt(elem.value))) {
                            this.max_quan_page = ge = parseInt(elem.value);
                            localStorage.max_quan_page = parseInt(elem.value);
                        }
                        break;
                    case 'send-message':
                        if (!isNaN(parseInt(elem.value))) {
                            this.send_message = parseInt(elem.value);
                            localStorage.send_message = parseInt(elem.value);
                        }
                        break;
                }
            }
        },
        clickHandler(e) {
            let elem = e.target;
            if (elem.id) {
                switch (elem.id) {
                    case 'auto-send':
                        if (!bot.auto_send) {
                            console.log(
                                '间隔',
                                localStorage.auto_send_time_span,
                                '秒'
                            );
                            console.log('send_message', this.send_message);
                            bot._startAutoSend(
                                this.auto_send_time_span,
                                this.send_message
                            );
                            this.auto_send_text = '停止群发消息';
                        } else {
                            this.auto_send_text = '开始群发消息';
                            bot._stopAutoSend();
                        }
                        break;
                    case 'btn-logout':
                        if (confirm('确定要注销登录？')) {
                            logout();
                        }
                        break;
                }
            } else {
                updateCheckedGroup(elem);
            }
        },
        showContacts() {
            this.page = 'contacts';
            this.groups = bot.groups;
        },
        login() {
            // 使用新的bot实例，避免旧bot实例绑定过多事件
            bot = bg_window.newBot();
            bot.on('alimama-login', avatar => {
                this.auto_send_text = '开始群发消息';
                bot._stopAutoSend();
            });
            bot.on('user-avatar', avatar => {
                $('.login_box .avatar img').attr('src', avatar);
                this.page = 'confirm';
            });
            bot.on('login', () => {
                console.log('登录成功');
                // 保存数据，方便快速登录
                localStorage.reloginProp = JSON.stringify(bot.botData);
                this.showContacts();
                this.quan_count = bot.quan_count;
            });
            bot.on('logout', () => {
                // 清除登录信息
                delete localStorage.reloginProp;
                this.login();
                console.log('注销成功');
            });
            bot.on('error', err => {
                console.log(err);
            });
            bot.on('contacts-updated', contacts => {
                bot._updateContact();
                // this.contacts = bot.ava_contacts;
                this.groups = bot.groups;
            });
            bot.on('uuid', uuid => {
                console.log('拿到uuid');
                $('.qrcode-img .img').attr({
                    src: `https://login.weixin.qq.com/qrcode/${uuid}`
                });
            });

            if (bot.PROP.uin) {
                // 存在登录数据时，可以随时调用restart进行重启
                bot.restart();
            } else {
                bot.start();
            }
        }
    },
    created() {
        bg_window = chrome.extension.getBackgroundPage();
        bot = bg_window.getBot();

        if (bot.state == bg_window.getWxState().login) {
            this.showContacts();
            this.initData();
        } else {
            this.page = 'scan';
            this.login();
        }
    }
}));

/* 
@elem {Object} Dom element
*/
function updateCheckedGroup(elem) {
    let name = encodeURI(elem.value),
        checked = elem.checked,
        groups = {},
        bot = bg_window.getBot();
    if (localStorage.checkedGroup) {
        groups = JSON.parse(localStorage.checkedGroup);
    }
    if (checked) {
        groups[name] = true;
    } else {
        delete groups[name];
    }

    // 更新bot.groups Checked属性
    for (let i in bot.groups) {
        let contact = bot.groups[i];
        if (contact.NickName == elem.value) {
            if (checked) {
                contact.Checked = true;
            } else {
                delete contact.Checked;
            }
            break;
        }
    }

    localStorage.checkedGroup = JSON.stringify(groups);
}

function logout() {
    console.log('注销');
    bot.stop();
    $vm.page = 'scan';
    $vm.login();
}
