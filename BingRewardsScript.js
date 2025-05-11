// ==UserScript==
// @name         移动端微软Rewards每日任务脚本
// @version      2025.2.27
// @description  盒马卡，加油卡，电影卡，天猫卡，山姆卡通通都有
// @author       怀沙2049
// @match        https://*.bing.com/*
// @license      GNU GPLv3
// @icon         https://www.bing.com/favicon.ico
// @connect      gumengya.com
// @run-at       document-end
// @note         更新于 2025年2月27日
// @supportURL   https://greasyfork.org/zh-CN/users/1192640-huaisha1224
// @homepageURL  https://greasyfork.org/zh-CN/users/1192640-huaisha1224
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @namespace    https://greasyfork.org/zh-CN/users/1192640-huaisha1224
// @downloadURL https://update.greasyfork.org/scripts/480355/%E7%A7%BB%E5%8A%A8%E7%AB%AF%E5%BE%AE%E8%BD%AFRewards%E6%AF%8F%E6%97%A5%E4%BB%BB%E5%8A%A1%E8%84%9A%E6%9C%AC.user.js
// @updateURL https://update.greasyfork.org/scripts/480355/%E7%A7%BB%E5%8A%A8%E7%AB%AF%E5%BE%AE%E8%BD%AFRewards%E6%AF%8F%E6%97%A5%E4%BB%BB%E5%8A%A1%E8%84%9A%E6%9C%AC.meta.js
// ==/UserScript==

var max_rewards = 30; //重复执行的次数
//每执行4次搜索后插入暂停时间,解决账号被监控不增加积分的问题
var pause_time = 9; // 暂停时长建议为16分钟,也就是960000(60000毫秒=1分钟)
var search_words = []; //搜索词
var appkey = "bfed863be867b77a9d6d1918b2cb539d";// 从https://www.gmya.net/api 网站申请的热门词接口APIKEY
var Hot_words_apis = "https://api.gmya.net/Api/";// 故梦热门词API接口网站


var default_search_words = [
    // 《汉书》名句
    "明犯强汉者，虽远必诛",   //《汉书·傅常郑甘陈段传》
    "水至清则无鱼，人至察则无徒", //《汉书·东方朔传》
    "失之毫厘，谬以千里",     //《汉书·司马迁传》
    "临渊羡鱼，不如退而结网", //《汉书·董仲舒传》
    
    // 《楚辞》名句
    "路漫漫其修远兮，吾将上下而求索", //《离骚》
    "悲莫悲兮生别离，乐莫乐兮新相知", //《九歌·少司命》
    "举世皆浊我独清，众人皆醉我独醒", //《渔父》
    "青云衣兮白霓裳，举长矢兮射天狼", //《九歌·东君》
    
    // 《魏书》名句
    "国之大事，在祀与戎",     //《魏书·礼志》
    "夫兵者凶器，战者危事",   //《魏书·高闾传》
    "明主思短而益善，暗主护短而永愚", //《魏书·李彪传》
    "立非常之事，必俟非常之人", //《魏书·昭成子孙列传》
    
    // 综合选取
    "胡马依北风，越鸟巢南枝", //《古诗十九首》(汉书辑录)
    "秋风起兮白云飞，草木黄落兮雁南归", //《秋风辞》(《汉书·艺文志》)
    "圣王先成民而后致力于神", //《左传》引《魏书》佚文
    "新沐者必弹冠，新浴者必振衣", //《楚辞·渔父》
    "诚既勇兮又以武，终刚强兮不可凌", //《楚辞·国殇》
    "民生各有所乐兮，余独好修以为常", //《离骚》
    "屯余车其千乘兮，齐玉轪而并驰", //《离骚》
    "身既死兮神以灵，魂魄毅兮为鬼雄", //《楚辞·国殇》
    "匈奴未灭，无以家为",     //《汉书·霍去病传》
    "宜县头槁街蛮夷邸间，以示万里", //《汉书·陈汤传》
    "夫众煦漂山，聚蚊成雷",   //《汉书·景十三王传》
    "钟子期死，伯牙终身不复鼓琴", //《汉书·司马迁传》
    "天与弗取，反受其咎；时至不行，反受其殃", //《汉书·萧何传》
    "不教而诛谓之虐",         //《汉书·董仲舒传》
    "善言天者必有征于人，善言古者必有验于今", //《汉书·董仲舒传》
    "盖有非常之功，必待非常之人", //《汉书·武帝纪》
    "临淄之途，车毂击，人肩摩", //《汉书·货殖传》
    "欲投鼠而忌器",           //《汉书·贾谊传》
    "千人所指，无病而死"      //《汉书·王嘉传》
];
//{weibohot}微博热搜榜/{bilihot}哔哩热搜榜/{douyinhot}抖音热搜榜/{zhihuhot}知乎热搜榜/{baiduhot}百度热搜榜

var keywords_source = ['DouYinHot','WeiBoHot','TouTiaoHot','ZhiHuHot', 'BaiduHot'];
var random_keywords_source = keywords_source[Math.floor(Math.random() * keywords_source.length)]
//每次运行时随机获取一个热门搜索词来源用来作为关键词
function douyinhot_dic() {
    // 根据 appkey 是否为空来决定如何构建 URL 地址
    let url;
    if (appkey) {
        url = Hot_words_apis + random_keywords_source + "?format=json&appkey=" + appkey; // 有 appkey 则添加 appkey 参数
    } else {
        url = Hot_words_apis + random_keywords_source; // 无 appkey 则直接请求接口地址
    }
    return new Promise((resolve, reject) => {
        // 发送GET请求到指定URL
        fetch(url)
            .then(response => response.json()) // 将返回的响应转换为JSON格式
            .then(data => {
                if (data.data.some(item => item)) {
                    // 提取每个元素的name属性值并追加随机汉字
                    const names = data.data.map(item => 
                        item.title + generateRandomHanString(Math.floor(Math.random() * 3) + 1) // 追加1-3个随机汉字
                    );
                    resolve(names);
                } else {
                    //如果为空使用默认搜索词
                    resolve(default_search_words)
                }
            })
            .catch(error => {
                // 如果请求失败，则返回默认搜索词
                resolve(default_search_words)
                reject(error); // 将错误信息作为Promise对象的错误返回
            });
    });
}



// 调用douyinhot_dic函数，获取names列表
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

// 生成指定长度的包含大写字母、数字的随机字符串
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // 62个可选字符
    let result = '';
    const charactersLength = characters.length; // 获取字符集长度(性能优化)
    
    // 循环构造随机字符串
    for (let i = 0; i < length; i++) {
        // 生成随机索引：0 ≤ randomIndex < charactersLength
        const randomIndex = Math.floor(Math.random() * charactersLength);
        // 拼接随机字符
        result += characters.charAt(randomIndex);
    }
    return result; // 返回生成的随机字符串
}
// 生成指定长度的随机汉字字符串
function generateRandomHanString(length) {
    let result = '';
    // Unicode汉字范围：0x4E00-0x9FA5（共20902个汉字）
    for (let i = 0; i < length; i++) {
        // 生成随机汉字编码
        const unicode = Math.floor(Math.random() * (0x9FA5 - 0x4E00 + 1)) + 0x4E00;
        // 将Unicode编码转换为汉字字符
        result += String.fromCharCode(unicode);
    }
    return result;
}

function exec() {
    // 生成10-30秒随机延迟防止请求频率过高
    let randomDelay = Math.floor(Math.random() * 20000) + 10000;
    // 生成4位随机字符串用于form参数
    let randomString = generateRandomString(4);
    // 生成32位设备标识cvid
    let randomCvid = generateRandomString(32);
    'use strict';

    // 初始化计数器（用于追踪搜索次数）
    if (GM_getValue('Cnt') == null) {
        GM_setValue('Cnt', max_rewards + 10);
    }

    // 获取当前搜索进度
    let currentSearchCount = GM_getValue('Cnt');
    
    // 前半段使用国际版Bing域名
    if (currentSearchCount <= max_rewards / 2) {
        // 更新页面标题显示进度
        let tt = document.getElementsByTagName("title")[0];
        tt.innerHTML = "[" + currentSearchCount + " / " + max_rewards + "] " + tt.innerHTML;
        
        // 执行页面滚动操作
        humanLikeScroll();
        
        // 更新搜索计数器
        GM_setValue('Cnt', currentSearchCount + 1);
        
        // 设置延迟执行搜索
        setTimeout(function () {
            let nowtxt = search_words[currentSearchCount];
            
            // 每2次搜索后添加暂停（反检测机制）
            if ((currentSearchCount + 1) % 2 === 0) {
                setTimeout(function() {
                    location.href = "https://www.bing.com/search?q=" + encodeURI(nowtxt) + "&form=" + randomString + "&cvid=" + randomCvid;
                }, pause_time);
            } else {
                location.href = "https://www.bing.com/search?q=" + encodeURI(nowtxt) + "&form=" + randomString + "&cvid=" + randomCvid;
            }
        }, randomDelay);
        
    // 后半段使用中国版Bing域名  
    } else if (currentSearchCount > max_rewards / 2 && currentSearchCount < max_rewards) {
        let tt = document.getElementsByTagName("title")[0];
        tt.innerHTML = "[" + currentSearchCount + " / " + max_rewards + "] " + tt.innerHTML; // 在标题中显示当前搜索次数
        smoothScrollToBottom(); // 添加执行滚动页面到底部的操作
        GM_setValue('Cnt', currentSearchCount + 1); // 将计数器加1
        setTimeout(function () {
            let nowtxt = search_words[currentSearchCount]; // 获取当前搜索词

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

    // 平滑滚动到底部函数（模拟用户浏览行为）
    function smoothScrollToBottom() {
        document.documentElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    // 人类行为模拟滚动函数
    function humanLikeScroll() {
        const maxScrolls = 3; // 最大滚动次数
        let scrollCount = 0;
        
        function randomScroll() {
            // 随机滚动方向（垂直+水平）
            window.scrollBy({
                left: Math.random() * 40 - 20, // -20到20像素横向滚动
                top: window.innerHeight * 0.7 + Math.random() * 100, // 70%屏幕高度+随机值
                behavior: 'smooth'
            });
            
            // 随机滚动间隔（0.8-1.5秒）
            if(++scrollCount < maxScrolls) {
                setTimeout(randomScroll, 800 + Math.random() * 700);
            }
        }
        
        // 初始延迟（0.5-1秒）后开始滚动
        setTimeout(randomScroll, 500 + Math.random() * 500);
    }

    // 模拟人类滚动模式（包含纵向+横向随机滚动）
    humanLikeScroll();
}
