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
			"MT10"
		],
		"floorPartitions": [],
		"images": [
			"IQ.png",
			"arrow.png",
			"atk.png",
			"bg.jpg",
			"boom.png",
			"botton.png",
			"cave2.jpg",
			"def.png",
			"exp.png",
			"hero1.png",
			"hero2.png",
			"hp.png",
			"money.png",
			"skill.png",
			"skill0.png",
			"skill1.png",
			"skill10.png",
			"skill11.png",
			"skill12.png",
			"skill13.png",
			"skill14.png",
			"skill2.png",
			"skill3.png",
			"skill4.png",
			"skill5.png",
			"skill6.png",
			"skill7.png",
			"skill8.png",
			"skill9.png",
			"title.jpg",
			"tower.jpg",
			"tower7.jpeg",
			"winskin.png",
			"winskin2.png",
			"winskin3.png"
		],
		"tilesets": [
			"magictower.png"
		],
		"animates": [],
		"bgms": [],
		"sounds": [
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
			"drink.mp3",
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
			"normal"
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
				"name": "easy",
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
			"startBackground": " ",
			"startVerticalBackground": " ",
			"startLogoStyle": " ",
			"startButtonsStyle": " ",
			"statusLeftBackground": " ",
			"statusTopBackground": " ",
			"toolsBackground": "#ddd4",
			"floorChangingStyle": " ",
			"statusBarColor": [
				255,
				255,
				255,
				1
			],
			"borderColor": [
				5,
				0,
				0,
				0
			],
			"selectColor": [
				255,
				215,
				0,
				1
			],
			"font": "normal"
		},
		"splitImages": [],
		"plugin": [
			"utils",
			"ui",
			"shop",
			"study",
			"hero",
			"fiveLayer",
			"loopMap",
			"removeMap",
			"heroFourFrames",
			"itemDetail",
			"skills",
			"towerBoss",
			"popup",
			"hotReload",
			"replay",
			"skillTree",
			"halo"
		]
	},
	"firstData": {
		"title": "插件教学",
		"name": "AncTePlugin",
		"version": "Ver 1.0.0",
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
				"name": "flag:itemDetail",
				"value": "true"
			},
			{
				"type": "setGlobalAttribute",
				"name": "font",
				"value": "normal"
			},
			{
				"type": "setText",
				"text": [
					255,
					255,
					255,
					1
				],
				"background": "winskin2.png",
				"textfont": 14
			}
		],
		"shops": [
			{
				"id": "snowShop",
				"item": true,
				"textInList": "道具商店",
				"use": "money",
				"mustEnable": true,
				"choices": [
					{
						"id": "sword2",
						"number": 1,
						"money": "600",
						"sell": "300"
					},
					{
						"id": "shield2",
						"number": 1,
						"money": "500",
						"sell": "250"
					},
					{
						"id": "I641",
						"number": 1,
						"money": "400",
						"sell": "200"
					}
				]
			}
		],
		"levelUp": [
			{
				"need": "0",
				"title": "原始人",
				"action": []
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
				"title": "低级智人",
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
				"need": "25000",
				"title": "中级智人",
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
		"enableRouteFolding": true,
		"disableShopOnDamage": false,
		"blurFg": true,
		"extendToolbar": true,
		"enableEnemyPoint": null,
		"autoScale": true
	}
}