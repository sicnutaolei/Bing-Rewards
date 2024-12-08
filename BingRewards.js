// ==UserScript==
// @name         Microsoft Bing Rewards每日任务脚本
// @version      V9.0.3
// @description  自动完成微软Rewards每日搜索任务,每次运行时获取抖音/微博/哔哩哔哩/百度/头条热门词,避免使用同样的搜索词被封号。
// @author       怀沙2049
// @match        https://www.bing.com/*
// @match        https://cn.bing.com/*
// @license      GNU GPLv3
// @icon         https://www.bing.com/favicon.ico
// @connect      api.gumengya.com
// @connect      192.168.195.198
// @connect      taolei.dynv6.net
// @run-at       document-end
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @namespace    https://greasyfork.org/zh-CN/scripts/477107
// ==/UserScript==

var max_rewards = 40; //重复执行的次数
//每执行4次搜索后插入暂停时间,解决账号被监控不增加积分的问题
var pause_time = 5; // 暂停时长建议为10分钟（600000毫秒=10分钟）
var search_words = []; //搜索词

//默认搜索词，热门搜索词请求失败时使用
var default_search_words = ["路漫漫其修远兮，吾将上下而求索", "书山有路勤为径，学海无涯苦作舟", "温故而知新，可以为师矣", "青青子衿，悠悠我心", "不积跬步，无以至千里", "会当凌绝顶，一览众山小", "非淡泊无以明志，非宁静无以致远", "天行健，君子以自强不息", "勿以恶小而为之，勿以善小而不为", "君子成人之美，不成人之恶", "业精于勤，荒于嬉", "读万卷书，行万里路", "岁月不居，时节如流", "青春须早为，岂能长少年", "黑发不知勤学早，白发方悔读书迟", "光阴似箭，日月如梭", "滴水穿石，非一日之功", "人生如梦，岁月如梭", "实践是检验真理的唯一标准", "活到老，学到老", "己所不欲，勿施于人", "机会总是留给有准备的人", "小不忍则乱大谋", "书到用时方恨少，事非经过不知难", "国家兴亡，匹夫有责", "人无远虑，必有近忧", "为中华之崛起而读书", "书读百遍，其义自见", "尽人事，听天命", "人生自古谁无死，留取丹心照汗青", "生于忧患，死于安乐", "言出必行，行之必果", "读书百遍，其义自见", "修身齐家治国平天下"， "老当益壮，宁移白首之心", "一日不读书，面目可憎", "英雄不问出处", "淡泊以明志，宁静以致远", "人生如梦，万事皆空"]

//{weibohot}微博热搜榜//{douyinhot}抖音热搜榜/{zhihuhot}知乎热搜榜/{baiduhot}百度热搜榜/{toutiaohot}今日头条热搜榜/
var keywords_source = ['36kr','ngabbs','weread','hellogithub','bilibili','douban-group'];
var random_keywords_source = keywords_source[Math.floor(Math.random() * keywords_source.length)]
var current_source_index = 0; // 当前搜索词来源的索引

/**
 * 尝试从多个搜索词来源获取搜索词，如果所有来源都失败，则返回默认搜索词。
 * @returns {Promise<string[]>} 返回搜索到的name属性值列表或默认搜索词列表
 */
async function douyinhot_dic() {
    while (current_source_index < keywords_source.length) {
        const source = keywords_source[current_source_index]; // 获取当前搜索词来源
        try {
            const response = await fetch("https://api.gumengya.com/Api/DouYinHot?format=json&appkey=b7a782741f667201b54880c925faec4b"); // 发起网络请求
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status); // 如果响应状态不是OK，则抛出错误
            }
            const data = await response.json(); // 解析响应内容为JSON

            if (data.data.some(item => item)) {
                // 如果数据中存在有效项
                // 提取每个元素的name属性值
                const names = data.data.map(item => item.title);
                return names; // 返回搜索到的name属性值列表
            }
        } catch (error) {
            // 当前来源请求失败，记录错误并尝试下一个来源
            console.error('搜索词来源请求失败:', error);
        }

        // 尝试下一个搜索词来源
        current_source_index++;
    }

    // 所有搜索词来源都已尝试且失败
    console.error('所有搜索词来源请求失败');
    return default_search_words; // 返回默认搜索词列表
}
douyinhot_dic()
    .then(names => {
    //   console.log(names[0]);
    search_words = names;
    exec()
})
    .catch(error => {
    console.error(error);
});

// 定义菜单命令：开始
let menu1 = GM_registerMenuCommand('开始', function () {
    GM_setValue('Cnt', 0); // 将计数器重置为0
    location.href = "https://www.bing.com/?br_msg=Please-Wait"; // 跳转到Bing首页
}, 'o');

// 定义菜单命令：停止
let menu2 = GM_registerMenuCommand('停止', function () {
    GM_setValue('Cnt', max_rewards + 10); // 将计数器设置为超过最大搜索次数，以停止搜索
}, 'o');

// 自动将字符串中的字符进行替换
function AutoStrTrans(st) {
    let yStr = st; // 原字符串
    let rStr = ""; // 插入的混淆字符，可以自定义自己的混淆字符串
    let zStr = ""; // 结果字符串
    let prePo = 0;
    for (let i = 0; i < yStr.length;) {
        let step = parseInt(Math.random() * 5) + 1; // 随机生成步长
        if (i > 0) {
            zStr = zStr + yStr.substr(prePo, i - prePo) + rStr; // 将插入字符插入到相应位置
            prePo = i;
        }
        i = i + step;
    }
    if (prePo < yStr.length) {
        zStr = zStr + yStr.substr(prePo, yStr.length - prePo); // 将剩余部分添加到结果字符串中
    }
    return zStr;
}

// 生成指定长度的包含大写字母、小写字母和数字的随机字符串
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        // 从字符集中随机选择字符，并拼接到结果字符串中
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function exec() {
    // 生成随机延迟时间
    let randomDelay = Math.floor(Math.random() * 20000) + 60000; // 60000 毫秒 = 60 秒
    let randomString = generateRandomString(4); //生成4个长度的随机字符串
    let randomCvid = generateRandomString(32); //生成32位长度的cvid
    'use strict';

    // 检查计数器的值，若为空则设置为超过最大搜索次数
    if (GM_getValue('Cnt') == null) {
        GM_setValue('Cnt', max_rewards + 10);
    }

    // 获取当前搜索次数
    let currentSearchCount = GM_getValue('Cnt');

    // 根据计数器的值选择搜索引擎
    if (currentSearchCount <= max_rewards / 2) {
        let tt = document.getElementsByTagName("title")[0];let tt = document.getElementsByTagName("title")[0]；
        tt.innerHTML = "[" + currentSearchCount + " / " + max_rewards + "] " + tt.innerHTML; // 在标题中显示当前搜索次数tt.innerHTML = "["   currentSearchCount   " / "   max_rewards   "] "   tt.innerHTML; // 在标题中显示当前搜索次数

        setTimeout(function () {
            GM_setValue('Cnt', currentSearchCount + 1); // 将计数器加1GM_setValue('Cnt', currentSearchCount   1); // 将计数器加1
            let nowtxt = search_words[currentSearchCount]; // 获取当前搜索词
            现在txt = AutoStrTrans(nowtxt); // 对搜索词进行替换

            // 检查是否需要暂停
            if ((currentSearchCount + 1) % 5 === 0) {
                // 暂停指定时长
                setTimeout(function() {
                    location.href = "https://www.bing.com/search?q=" + encodeURI(nowtxt) + "&form=" + randomString + "&cvid=" + randomCvid; // 在Bing搜索引擎中搜索
                }, pause_time);
            } else {
                location.href = "https://www.bing.com/search?q=" + encodeURI(nowtxt) + "&form=" + randomString + "&cvid=" + randomCvid; // 在Bing搜索引擎中搜索
            }
        }, randomDelay);
    } else if (currentSearchCount > max_rewards / 2 && currentSearchCount < max_rewards) {
        let tt = document.getElementsByTagName("title")[0];
        tt.innerHTML = "[" + currentSearchCount + " / " + max_rewards + "] " + tt.innerHTML; // 在标题中显示当前搜索次数

        setTimeout(function () {
            GM_setValue('Cnt', currentSearchCount + 1); // 将计数器加1
            let nowtxt = search_words[currentSearchCount]; // 获取当前搜索词
            现在txt = AutoStrTrans(nowtxt); // 对搜索词进行替换

            // 检查是否需要暂停
            if ((currentSearchCount + 1) % 5 === 0) {
                // 暂停指定时长
                setTimeout(function() {
                    location.href = "https://cn.bing.com/search?q=" + encodeURI(nowtxt) + "&form=" + randomString + "&cvid=" + randomCvid; // 在Bing搜索引擎中搜索
                }, pause_time);
            } else {
                location.href = "https://cn.bing.com/search?q=" + encodeURI(nowtxt) + "&form=" + randomString + "&cvid=" + randomCvid; // 在Bing搜索引擎中搜索
            }
        }, randomDelay);
    }
}
