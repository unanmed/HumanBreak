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
			"bgm.opus"
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
					0,
					1
				],
				"action": []
			},
			{
				"title": "普通",
				"name": "medium",
				"hard": 2,
				"color": [
					255,
					255,
					0,
					1
				],
				"action": []
			},
			{
				"title": "困难",
				"name": "hard",
				"hard": 3,
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
		"startBgm": "bgm.opus",
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
			"name": "阳光",
			"lv": 1,
			"hpmax": 0,
			"hp": 500,
			"manamax": -1,
			"mana": 0,
			"atk": 100,
			"def": 100,
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
				"type": "text",
				"text": "欢迎使用古祠制作的 2.B 样板，本样板主要针对渲染系统进行了重构，现在我们有了更加方便强大的渲染系统，也对部分相关事件进行了重置！"
			},
			{
				"type": "text",
				"text": "同时 2.B 样板也新增了很多接口，在造塔时可以提供非常大的帮助！"
			},
			{
				"type": "text",
				"text": "这里是开场剧情，可以在编辑器全塔属性中修改，试着修改一下吧！"
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
		"animateSpeed": 400,
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
		"itemFirstText": false,
		"enableAddPoint": false,
		"enableNegativeDamage": false,
		"betweenAttackMax": true,
		"enableGentleClick": true,
		"ignoreChangeFloor": true,
		"canGoDeadZone": false,
		"enableMoveDirectly": true,
		"enableRouteFolding": true,
		"disableShopOnDamage": false,
		"blurFg": true
	}
}