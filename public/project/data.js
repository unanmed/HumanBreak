var data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d = 
{
	"main": {
		"floorIds": [
			"empty",
			"sample0",
			"sample1",
			"sample2",
			"MT0"
		],
		"floorPartitions": [],
		"images": [
			"bear.png",
			"bg.jpg",
			"brave.png",
			"dragon.png",
			"hero.png",
			"winskin.png"
		],
		"tilesets": [
			"magictower.png"
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
			"beforeBoss.opus",
			"beforeNight.opus",
			"cave.opus",
			"chapter2ED.opus",
			"escape.opus",
			"escape2.opus",
			"grass.opus",
			"mount.opus",
			"night.opus",
			"palaceCenter.opus",
			"palaceNorth.opus",
			"palaceSouth.opus",
			"plot1.opus",
			"road.opus",
			"title.opus",
			"tower.opus",
			"towerBoss.opus",
			"towerBoss2.opus",
			"towerBoss3.opus",
			"winter.opus",
			"winterTown.opus"
		],
		"sounds": [
			"008-System08.opus",
			"015-Jump01.opus",
			"050-Explosion03.opus",
			"051-Explosion04.opus",
			"087-Action02.opus",
			"094-Attack06.opus",
			"118-Fire02.opus",
			"119-Fire03.opus",
			"120-Ice01.opus",
			"arrow.opus",
			"attack.opus",
			"bomb.opus",
			"cancel.opus",
			"centerFly.opus",
			"chapter.opus",
			"confirm.opus",
			"cursor.opus",
			"danger.opus",
			"door.opus",
			"drink.opus",
			"electron.opus",
			"equip.opus",
			"error.opus",
			"floor.opus",
			"gem.opus",
			"icePickaxe.opus",
			"item.opus",
			"jump.opus",
			"load.opus",
			"open_ui.opus",
			"paper.opus",
			"pickaxe.opus",
			"quake.opus",
			"recovery.opus",
			"save.opus",
			"shake.opus",
			"shop.opus",
			"thunder.opus",
			"tree.opus",
			"zone.opus"
		],
		"fonts": [],
		"nameMap": {
			"确定": "confirm.opus",
			"取消": "cancel.opus",
			"操作失败": "error.opus",
			"光标移动": "cursor.opus",
			"打开界面": "open_ui.opus",
			"读档": "load.opus",
			"存档": "save.opus",
			"获得道具": "item.opus",
			"回血": "recovery.opus",
			"炸弹": "bomb.opus",
			"飞行器": "centerFly.opus",
			"开关门": "door.opus",
			"上下楼": "floor.opus",
			"跳跃": "jump.opus",
			"破墙镐": "pickaxe.opus",
			"破冰镐": "icePickaxe.opus",
			"宝石": "gem.opus",
			"阻激夹域": "zone.opus",
			"穿脱装备": "equip.opus",
			"背景音乐": "bgm.opus",
			"攻击": "attack.opus",
			"背景图": "bg.jpg",
			"商店": "shop.opus",
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
						"type": "setCurtain",
						"color": [
							0,
							0,
							0,
							1
						],
						"time": 0,
						"keep": true
					},
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
				"action": [
					{
						"type": "setCurtain",
						"color": [
							0,
							0,
							0,
							1
						],
						"time": 0,
						"keep": true
					}
				]
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
		"startBgm": "title.opus",
		"styles": {
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
		"splitImages": []
	},
	"firstData": {
		"title": "魔塔样板",
		"name": "template",
		"version": "Ver 2.B",
		"floorId": "sample0",
		"hero": {
			"image": "hero.png",
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
				"x": 6,
				"y": 10
			},
			"flags": {},
			"followers": [],
			"steps": 0,
			"magicDef": 0,
			"magicRed": 0
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
				"type": "hideStatusBar"
			},
			{
				"type": "setText",
				"position": "down",
				"text": [
					0,
					0,
					0,
					1
				],
				"background": "winskin.png",
				"textfont": 20,
				"time": 25,
				"letterSpacing": 1
			},
			{
				"type": "setGlobalAttribute",
				"name": "font",
				"value": "normal"
			},
			{
				"type": "playSound",
				"name": "paper.opus"
			},
			"人们说要铭记历史，但他们却忘记了历史。\n    ——我是这样评价这个故事的。",
			{
				"type": "playSound",
				"name": "paper.opus"
			},
			"人类简史——起源篇",
			{
				"type": "playSound",
				"name": "paper.opus"
			},
			"在历史的长河中，山火、暴雨、地震不过是自然界的常态，是时间流逝中微不足道的涟漪。",
			{
				"type": "playSound",
				"name": "paper.opus"
			},
			"这些自然现象如同大地的呼吸，时而平静，时而狂暴。",
			{
				"type": "playSound",
				"name": "paper.opus"
			},
			"对于动物和植物而言，这些变化是生存的考验，是自然选择的无情法则。",
			{
				"type": "playSound",
				"name": "paper.opus"
			},
			"每一次山火，都意味着森林的重生与毁灭；每一场暴雨，都带来了生命的滋润与洪水的威胁；每一次地震，都改变了地貌，塑造了新的环境。",
			{
				"type": "playSound",
				"name": "paper.opus"
			},
			"在这片土地上，生命在自然的力量中挣扎、适应、繁衍。",
			{
				"type": "playSound",
				"name": "paper.opus"
			},
			"那些无法适应的，最终被淘汰；而那些幸存者，则继续在这片土地上书写着生命的传奇。",
			{
				"type": "playSound",
				"name": "paper.opus"
			},
			"然而，对于那些在这片土地上生存的原始人而言，这些自然现象不仅仅是生存的考验，更是他们日常生活中不可或缺的一部分。",
			{
				"type": "playSound",
				"name": "paper.opus"
			},
			"在公元前8000年，这里曾有一个不起眼的山洞，隐匿于群山之间，仿佛与世隔绝。山洞中，原始人正忙碌着，准备迎接即将到来的季节变化。",
			{
				"type": "playSound",
				"name": "paper.opus"
			},
			{
				"type": "sleep",
				"time": 1000
			},
			{
				"type": "setText",
				"position": "down",
				"text": [
					255,
					255,
					255,
					1
				],
				"background": "winskin.png",
				"textfont": 20,
				"time": 25
			},
			{
				"type": "showStatusBar"
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
				"action": [
					{
						"type": "setValue",
						"name": "status:mdef",
						"operator": "+=",
						"value": "2000"
					},
					{
						"type": "setValue",
						"name": "status:atk",
						"operator": "+=",
						"value": "25"
					},
					{
						"type": "setValue",
						"name": "status:def",
						"operator": "+=",
						"value": "25"
					},
					"恭喜升级！攻防+25，智慧+2000！"
				]
			},
			{
				"need": "100000",
				"title": "高级智人",
				"clear": true,
				"action": [
					{
						"type": "setValue",
						"name": "status:mdef",
						"operator": "+=",
						"value": "10000"
					},
					{
						"type": "setValue",
						"name": "status:atk",
						"operator": "+=",
						"value": "250"
					},
					{
						"type": "setValue",
						"name": "status:def",
						"operator": "+=",
						"value": "250"
					},
					"恭喜升级！攻防+250，智慧+10000！",
					"这是这个游戏的最后一级，第三章的玩法会改变，不再设置等级"
				]
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
			"enableHP",
			"enableAtk",
			"enableDef",
			"enableMDef",
			"enableMoney",
			"enableExp",
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
		"extendToolbar": false,
		"enableEnemyPoint": null,
		"autoScale": true
	}
}