//=============================================================================
// MKR_MapScrollFix.js
//=============================================================================
// Copyright (c) 2016-2017 マンカインド
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.0.1 2017/10/04 スクロール固定時、画面外への離脱と画面内への侵入を
//                  制限できるようにした。
//
// 1.0.0 2016/10/24 初版公開。
// ----------------------------------------------------------------------------
// [Twitter] https://twitter.com/mankind_games/
//  [GitHub] https://github.com/mankindGames/
//    [Blog] http://mankind-games.blogspot.jp/
//=============================================================================

/*:
 *
 * @plugindesc (v1.0.1) マップスクロール固定プラグイン
 * @author マンカインド
 *
 * @help = マップスクロール固定プラグイン ver 1.0.1 =
 * MKR_MapScrollFix.js - マンカインド
 *
 * 指定されたスイッチがオンの間、
 * プレイヤーの移動によるマップスクロールを固定します。
 *
 * プラグインパラメーターでスクロールを禁止するためのスイッチ番号を指定します。
 * ゲーム中にそのスイッチがオンになると画面が固定されます。
 *
 * 同じくプラグインパラメータにより、イベントが固定された画面から外への離脱、
 * 画面内への侵入が可能か設定できます。
 * (イベントがすり抜けONの場合、この設定は無視されます)
 *
 *
 * プラグインコマンド:
 *   ありません。
 *
 *
 * スクリプトコマンド:
 *   ありません。
 *
 *
 * 補足：
 *   ・このプラグインに関するメモ欄の設定、プラグインコマンド/パラメーター、
 *     制御文字は大文字/小文字を区別していません。
 *
 *
 * 利用規約:
 *   ・作者に無断で本プラグインの改変、再配布が可能です。
 *     (ただしヘッダーの著作権表示部分は残してください。)
 *
 *   ・利用形態(フリーゲーム、商用ゲーム、R-18作品等)に制限はありません。
 *     ご自由にお使いください。
 *
 *   ・本プラグインを使用したことにより発生した問題について作者は一切の責任を
 *     負いません。
 *
 *   ・要望などがある場合、本プラグインのバージョンアップを行う
 *     可能性がありますが、
 *     バージョンアップにより本プラグインの仕様が変更される可能性があります。
 *     ご了承ください。
 *
 *
 * @param Default_Scroll_Fix_Sw
 * @text スクロール固定スイッチ
 * @desc マップスクロールを固定するスイッチの番号を指定します。
 * @type switch
 * @default 10
 *
 * @param Is_Display_Out
 * @text 画面外への離脱
 * @desc スクロール固定時、イベントが画面外へと移動可能か選択します。
 * @type boolean
 * @on 移動可能
 * @off 移動不可
 * @default true
 *
 * @param Is_Display_In
 * @text 画面内への侵入
 * @desc スクロール固定時、画面外にいるイベントが画面内へと移動可能か選択します。
 * @type boolean
 * @on 移動可能
 * @off 移動不可
 * @default true
 *
 *
*/

var Imported = Imported || {};
Imported.MKR_MapScrollFix = true;

(function () {
    'use strict';

    const PN = "MKR_MapScrollFix";

    const CheckParam = function(type, name, value, def, min, max, options) {
        if(min == undefined || min == null) {
            min = -Infinity;
        }
        if(max == undefined || max == null) {
            max = Infinity;
        }

        if(value == null) {
            value = "";
        } else {
            value = String(value);
        }

        switch(type) {
            case "bool":
                if(value == "") {
                    value = (def)? true : false;
                }
                value = value.toUpperCase() === "ON" || value.toUpperCase() === "TRUE" || value.toUpperCase() === "1";
                break;
            case "num":
                value = (isFinite(value))? parseInt(value, 10) : (isFinite(def))? parseInt(def, 10) : 0;
                value = value.clamp(min, max);
                break;
            default:
                throw new Error("[CheckParam] " + name + "のタイプが不正です: " + type);
                break;
        }

        return [value, type, def, min, max];
    };

    const paramParse = function(obj) {
        return JSON.parse(JSON.stringify(obj, paramReplace));
    }

    const paramReplace = function(key, value) {
        try {
            return JSON.parse(value || null);
        } catch (e) {
            return value;
        }
    };

    const Parameters = paramParse(PluginManager.parameters(PN));
    let Params = {};

    Params = {
        "ScrollFixSw" : CheckParam("num", "Default_Scroll_Fix_Sw", Parameters["Default_Scroll_Fix_Sw"], 10, 0),
        "IsDisplayOut" : CheckParam("bool", "Is_Display_Out", Parameters["Is_Display_Out"], true),
        "IsDisplayIn" : CheckParam("bool", "Is_Display_In", Parameters["Is_Display_In"], true),
    };


    //=========================================================================
    // Game_Player
    //  ・プレイヤー移動による画面のスクロールを再定義します。
    //
    //=========================================================================
    var _Game_Player_updateScroll = Game_Player.prototype.updateScroll;
    Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
        if(!$gameSwitches.value(Params.ScrollFixSw[0])) {
            _Game_Player_updateScroll.apply(this, arguments);
        }
    };


    //=========================================================================
    // Game_CharacterBase
    //  ・画面外への移動可能判定を定義します
    //
    //=========================================================================
    var _Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
    Game_CharacterBase.prototype.canPass = function(x, y, d) {
        let isPass, x2, y2;
        isPass = _Game_CharacterBase_canPass.apply(this, arguments);

        if(!this.isThrough() && $gameSwitches.value(Params.ScrollFixSw[0])) {
            if(isPass && !Params.IsDisplayOut[0]) {
                isPass = this.isDisplayOutPassible(x, y, d);
            }
            if(isPass && !Params.IsDisplayIn[0]) {
                isPass = this.isDisplayInPassible(x, y, d);
            }
        }

        return isPass;
    };

    Game_CharacterBase.prototype.isDisplayOutPassible = function(x, y, d) {
        let x2, y2, dx, rdx, dy, rdy;
        dx = $gameMap.displayX();
        rdx = dx + $gameMap.screenTileX() - 1;
        dy = $gameMap.displayY();
        rdy = dy + $gameMap.screenTileY() - 1;
        x2 = $gameMap.roundXWithDirection(x, d);
        y2 = $gameMap.roundYWithDirection(y, d);

        switch(true) {
            case x == dx && x2 < dx:
            case x == rdx && x2 > rdx:
            case y == dy && y2 < dy:
            case y == rdy && y2 > rdy:
                return false;
        }
        return true;
    };

    Game_CharacterBase.prototype.isDisplayInPassible = function(x, y, d) {
        let x2, y2, dx, rdx, dy, rdy;
        dx = $gameMap.displayX();
        rdx = dx + $gameMap.screenTileX();
        dx--;
        dy = $gameMap.displayY();
        rdy = dy + $gameMap.screenTileY();
        dy--;
        x2 = $gameMap.roundXWithDirection(x, d);
        y2 = $gameMap.roundYWithDirection(y, d);

        switch(true) {
            case x == dx && x2 > dx:
            case x == rdx && x2 < rdx:
            case y == dy && y2 > dy:
            case y == rdy && y2 < rdy:
                return false;
        }
        return true;
    };
})();