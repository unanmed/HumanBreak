var data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d = 
{
	"main": {
		"floorIds": [
			"MT0",
			"MT1",
			"MT2",
			"MT3",
			"MT4",
			"MT5",
			"MT6",
			"MT7",
			"MT8",
			"MT9",
			"MT10",
			"MT11",
			"MT12",
			"MT13",
			"MT14",
			"MT15",
			"MT16",
			"MT17",
			"MT18",
			"MT19",
			"MT20",
			"MT21",
			"tower1",
			"tower2",
			"tower3",
			"tower4",
			"tower5",
			"tower6",
			"tower7"
		],
		"floorPartitions": [
			[
				"MT0",
				"MT16"
			],
			[
				"MT17"
			]
		],
		"images": [
			"IQ.png",
			"arrow.png",
			"atk.png",
			"beforeBoss.jpg",
			"bg.jpg",
			"boom.png",
			"botton.png",
			"cave.jpg",
			"cave1.jpg",
			"cave2.jpg",
			"def.png",
			"escape.jpg",
			"exp.png",
			"grass.jpg",
			"hero1.png",
			"hero2.png",
			"hp.png",
			"money.png",
			"mount.jpg",
			"plot1.jpg",
			"skill0.png",
			"skill1.png",
			"skill2.png",
			"skill3.png",
			"skill4.png",
			"skill5.png",
			"skill6.png",
			"skill7.png",
			"title.jpg",
			"tower.jpg",
			"tower6.jpeg",
			"tower7.jpeg",
			"towerBoss.jpg",
			"towerBoss2.jpg",
			"towerBoss3.jpg",
			"winskin.png",
			"winskin2.png",
			"winskin3.png"
		],
		"tilesets": [
			"magictower.png",
			"043-Cave01.png",
			"004-Mountain01.png",
			"Map-Tower01.png",
			"Caverna1.png",
			"map-tower.png"
		],
		"animates": [
			"amazed",
			"angry",
			"angry2",
			"bulb",
			"emm",
			"explosion1",
			"explosion2",
			"explosion3",
			"explosion4",
			"fire",
			"focus",
			"fret",
			"hand",
			"ice",
			"jianji",
			"luv",
			"magicAtk",
			"stone",
			"sweat",
			"sweat2",
			"sword",
			"zone"
		],
		"bgms": [
			"beforeBoss.mp3",
			"cave.mp3",
			"escape.mp3",
			"grass.mp3",
			"mount.mp3",
			"plot1.mp3",
			"title.mp3",
			"tower.mp3",
			"towerBoss.mp3",
			"towerBoss2.mp3",
			"towerBoss3.mp3"
		],
		"sounds": [
			"008-System08.ogg",
			"015-Jump01.ogg",
			"050-Explosion03.ogg",
			"051-Explosion04.ogg",
			"087-Action02.ogg",
			"094-Attack06.ogg",
			"118-Fire02.ogg",
			"119-Fire03.ogg",
			"120-Ice01.ogg",
			"arrow.mp3",
			"attack.mp3",
			"bomb.mp3",
			"cancel.mp3",
			"centerFly.mp3",
			"chapter.mp3",
			"confirm.mp3",
			"cursor.mp3",
			"danger.mp3",
			"door.mp3",
			"electron.mp3",
			"equip.mp3",
			"error.mp3",
			"floor.mp3",
			"item.mp3",
			"jump.mp3",
			"load.mp3",
			"open_ui.mp3",
			"paper.mp3",
			"pickaxe.mp3",
			"quake.mp3",
			"recovery.mp3",
			"save.mp3",
			"shake.mp3",
			"shop.mp3",
			"thunder.mp3",
			"tree.mp3",
			"zone.mp3"
		],
		"fonts": [
			"normal",
			"scroll"
		],
		"nameMap": {
			"确定": "confirm.mp3",
			"取消": "cancel.mp3",
			"操作失败": "error.mp3",
			"光标移动": "cursor.mp3",
			"打开界面": "open_ui.mp3",
			"读档": "load.mp3",
			"存档": "save.mp3",
			"获得道具": "item.mp3",
			"回血": "recovery.mp3",
			"炸弹": "bomb.mp3",
			"飞行器": "centerFly.mp3",
			"开关门": "door.mp3",
			"上下楼": "floor.mp3",
			"跳跃": "jump.mp3",
			"破墙镐": "pickaxe.mp3",
			"破冰镐": "icePickaxe.mp3",
			"宝石": "gem.mp3",
			"阻激夹域": "zone.mp3",
			"穿脱装备": "equip.mp3",
			"背景音乐": "bgm.mp3",
			"攻击": "attack.mp3",
			"背景图": "bg.jpg",
			"商店": "shop.mp3",
			"领域": "zone"
		},
		"levelChoose": [
			{
				"title": "简单",
				"name": "Easy",
				"hard": 1,
				"color": [
					0,
					255,
					22,
					1
				],
				"action": [
					{
						"type": "setValue",
						"name": "status:atk",
						"operator": "+=",
						"value": "3"
					},
					{
						"type": "setValue",
						"name": "status:def",
						"operator": "+=",
						"value": "2"
					},
					"简单难度下，初始攻击+3，初始防御+2，全局减伤10%，绿宝石效果*2"
				]
			},
			{
				"title": "困难",
				"name": "hard",
				"hard": 2,
				"color": [
					255,
					0,
					0,
					1
				],
				"action": []
			}
		],
		"equipName": [
			"武器",
			"盾牌",
			"衣服",
			"鞋子",
			"首饰",
			"首饰",
			"首饰"
		],
		"startBgm": "title.mp3",
		"styles": {
			"startBackground": "project/images/bg.jpg",
			"startVerticalBackground": "project/images/bg.jpg",
			"startLogoStyle": " ",
			"startButtonsStyle": "background-color: #32369F; opacity: 0.85; color: #FFFFFF; border: #FFFFFF 2px solid; caret-color: #FFD700;",
			"statusLeftBackground": "url(project/images/cave1.jpg)",
			"statusTopBackground": "url(project/images/cave2.jpg) no-repeat",
			"toolsBackground": "url(project/images/cave2.jpg) no-repeat",
			"floorChangingStyle": "background-color: #000000;color:#000000",
			"statusBarColor": [
				255,
				255,
				255,
				1
			],
			"borderColor": [
				204,
				204,
				204,
				1
			],
			"selectColor": [
				255,
				215,
				0,
				1
			],
			"font": "normal"
		},
		"splitImages": []
	},
	"firstData": {
		"title": "人类：开天辟地",
		"name": "HumanBreak",
		"version": "Ver 2.7.3.1",
		"floorId": "MT0",
		"hero": {
			"image": "hero1.png",
			"animate": false,
			"name": "原始人",
			"lv": 1,
			"hpmax": 0,
			"hp": 500,
			"manamax": -1,
			"mana": 0,
			"atk": 7,
			"def": 5,
			"mdef": 20,
			"money": 0,
			"exp": 0,
			"equipment": [],
			"items": {
				"constants": {},
				"tools": {},
				"equips": {}
			},
			"loc": {
				"direction": "up",
				"x": 7,
				"y": 13
			},
			"flags": {},
			"followers": [],
			"steps": 0
		},
		"startCanvas": [
			{
				"type": "comment",
				"text": "在这里可以用事件来自定义绘制标题界面的背景图等"
			},
			{
				"type": "comment",
				"text": "也可以直接切换到其他楼层（比如某个开始剧情楼层）进行操作。"
			},
			{
				"type": "showImage",
				"code": 1,
				"image": "bg.jpg",
				"loc": [
					0,
					0
				],
				"opacity": 1,
				"time": 0
			},
			{
				"type": "while",
				"condition": "1",
				"data": [
					{
						"type": "comment",
						"text": "给用户提供选择项，这里简单的使用了choices事件"
					},
					{
						"type": "comment",
						"text": "也可以贴按钮图然后使用等待操作来完成"
					},
					{
						"type": "choices",
						"choices": [
							{
								"text": "开始游戏",
								"action": [
									{
										"type": "comment",
										"text": "检查bgm状态，下同"
									},
									{
										"type": "function",
										"function": "function(){\ncore.control.checkBgm()\n}"
									},
									{
										"type": "if",
										"condition": "main.levelChoose.length == 0",
										"true": [
											{
												"type": "comment",
												"text": "直接开始游戏"
											}
										],
										"false": [
											{
												"type": "comment",
												"text": "动态生成难度选择项"
											},
											{
												"type": "function",
												"function": "function(){\nvar choices = [];\nmain.levelChoose.forEach(function (one) {\n\tchoices.push({\n\t\t\"text\": one.title || '',\n\t\t\"action\": [\n\t\t\t{ \"type\": \"function\", \"function\": \"function() { core.status.hard = '\" + (one.name || '') + \"'; }\" }\n\t\t]\n\t});\n})\ncore.insertAction({ \"type\": \"choices\", \"choices\": choices });\n}"
											}
										]
									},
									{
										"type": "hideImage",
										"code": 1,
										"time": 0
									},
									{
										"type": "comment",
										"text": "成功选择难度"
									},
									{
										"type": "break"
									}
								]
							},
							{
								"text": "读取存档",
								"action": [
									{
										"type": "function",
										"function": "function(){\ncore.control.checkBgm()\n}"
									},
									{
										"type": "comment",
										"text": "简单的使用“呼出读档界面”来处理"
									},
									{
										"type": "callLoad"
									}
								]
							},
							{
								"text": "回放录像",
								"action": [
									{
										"type": "function",
										"function": "function(){\ncore.control.checkBgm()\n}"
									},
									{
										"type": "comment",
										"text": "这段代码会弹框选择录像文件"
									},
									{
										"type": "if",
										"condition": "(!core.isReplaying())",
										"true": [
											{
												"type": "function",
												"function": "function(){\ncore.chooseReplayFile()\n}"
											}
										]
									}
								]
							}
						]
					}
				]
			},
			{
				"type": "comment",
				"text": "接下来会执行startText中的事件"
			}
		],
		"startText": [
			{
				"type": "setValue",
				"name": "flag:usePlatFly",
				"value": "true"
			},
			{
				"type": "setValue",
				"name": "flag:__useMinimap__",
				"value": "true"
			},
			{
				"type": "setValue",
				"name": "flag:fixToBook",
				"value": "false"
			},
			{
				"type": "setValue",
				"name": "flag:itemDetail",
				"value": "true"
			},
			{
				"type": "setValue",
				"name": "item:book",
				"value": "1"
			},
			{
				"type": "setValue",
				"name": "item:wand",
				"value": "1"
			},
			{
				"type": "setValue",
				"name": "item:I330",
				"value": "1"
			},
			{
				"type": "hideStatusBar"
			},
			{
				"type": "setText",
				"text": [
					0,
					0,
					0,
					1
				],
				"background": "winskin3.png",
				"textfont": 20,
				"time": 25
			},
			{
				"type": "setGlobalAttribute",
				"name": "font",
				"value": "scroll"
			},
			{
				"type": "playSound",
				"name": "paper.mp3"
			},
			"人类简史——起源篇",
			{
				"type": "playSound",
				"name": "paper.mp3"
			},
			"这是人类史上的一大进展",
			{
				"type": "playSound",
				"name": "paper.mp3"
			},
			"人类开始使用工具",
			{
				"type": "playSound",
				"name": "paper.mp3"
			},
			"人类开始使用武器",
			{
				"type": "playSound",
				"name": "paper.mp3"
			},
			"人类开始狩猎",
			{
				"type": "playSound",
				"name": "paper.mp3"
			},
			"人类终于摆脱了四肢行走",
			{
				"type": "playSound",
				"name": "paper.mp3"
			},
			"它让人类创造无限可能",
			{
				"type": "playSound",
				"name": "paper.mp3"
			},
			"这是人类史上最辉煌的时刻",
			{
				"type": "sleep",
				"time": 1000
			},
			{
				"type": "playSound",
				"name": "paper.mp3"
			},
			"公元前8000年",
			{
				"type": "setText",
				"text": [
					255,
					255,
					255,
					1
				],
				"background": "winskin2.png",
				"textfont": 20,
				"time": 25
			},
			{
				"type": "showStatusBar"
			},
			{
				"type": "setGlobalAttribute",
				"name": "font",
				"value": "normal"
			}
		],
		"shops": [],
		"levelUp": [
			{
				"need": "0",
				"title": "原始人",
				"action": [
					{
						"type": "comment",
						"text": "此处是初始等级，只需填写称号"
					}
				]
			},
			{
				"need": "3000",
				"title": "野蛮人",
				"clear": true,
				"action": [
					{
						"type": "setValue",
						"name": "status:atk",
						"operator": "+=",
						"value": "10"
					},
					{
						"type": "setValue",
						"name": "status:def",
						"operator": "+=",
						"value": "10"
					},
					{
						"type": "setValue",
						"name": "status:mdef",
						"operator": "+=",
						"value": "200"
					},
					"恭喜升级！攻防+10，智慧+200！",
					"行走图改变！",
					{
						"type": "setHeroIcon",
						"name": "hero2.png"
					}
				]
			},
			{
				"need": "10000",
				"title": "智人",
				"clear": true,
				"action": [
					{
						"type": "setValue",
						"name": "status:mdef",
						"operator": "+=",
						"value": "1000"
					},
					"恭喜升级！智慧+1000！"
				]
			},
			{
				"need": "50000",
				"title": "领导者",
				"clear": true,
				"action": []
			}
		]
	},
	"values": {
		"lavaDamage": 100,
		"poisonDamage": 10,
		"weakValue": 20,
		"redGem": 3,
		"blueGem": 3,
		"greenGem": 5,
		"redPotion": 100,
		"bluePotion": 250,
		"yellowPotion": 500,
		"greenPotion": 800,
		"breakArmor": 0.9,
		"counterAttack": 0.1,
		"purify": 3,
		"hatred": 2,
		"animateSpeed": 277.7778,
		"statusCanvasRowsOnMobile": 3,
		"floorChangeTime": 200,
		"moveSpeed": null
	},
	"flags": {
		"statusBarItems": [
			"enableFloor",
			"enableLv",
			"enableHP",
			"enableAtk",
			"enableDef",
			"enableMDef",
			"enableMoney",
			"enableExp",
			"enableLevelUp",
			"levelUpLeftMode",
			"enableKeys"
		],
		"flyNearStair": false,
		"flyRecordPosition": true,
		"steelDoorWithoutKey": true,
		"itemFirstText": false,
		"equipboxButton": false,
		"enableAddPoint": false,
		"enableNegativeDamage": true,
		"betweenAttackMax": false,
		"useLoop": true,
		"startUsingCanvas": false,
		"statusCanvas": true,
		"displayEnemyDamage": true,
		"displayCritical": true,
		"displayExtraDamage": true,
		"enableGentleClick": true,
		"ignoreChangeFloor": true,
		"canGoDeadZone": false,
		"enableMoveDirectly": true,
		"enableRouteFolding": false,
		"disableShopOnDamage": false,
		"blurFg": true,
		"extendToolbar": false,
		"enableEnemyPoint": null
	}
}