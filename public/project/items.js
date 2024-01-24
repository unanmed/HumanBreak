var items_296f5d02_12fd_4166_a7c1_b5e830c9ee3a = 
{
	"yellowKey": {
		"cls": "tools",
		"name": "黄钥匙",
		"text": "可以打开一扇黄门",
		"hideInToolbox": true
	},
	"blueKey": {
		"cls": "tools",
		"name": "蓝钥匙",
		"text": "可以打开一扇蓝门",
		"hideInToolbox": true
	},
	"redKey": {
		"cls": "tools",
		"name": "红钥匙",
		"text": "可以打开一扇红门",
		"hideInToolbox": true
	},
	"redGem": {
		"cls": "items",
		"name": "小红宝石",
		"text": "攻击+${core.values.redGem}",
		"itemEffect": "core.status.hero.atk += 1 * core.status.thisMap.ratio",
		"itemEffectTip": "，攻击+${1 * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.atk += core.values.redGem",
		"canUseItemEffect": "true"
	},
	"blueGem": {
		"cls": "items",
		"name": "小蓝宝石",
		"text": "，防御+${core.values.blueGem}",
		"itemEffect": "core.status.hero.def += 1 * core.status.thisMap.ratio",
		"itemEffectTip": "，防御+${1 * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.def += core.values.blueGem",
		"canUseItemEffect": "true"
	},
	"greenGem": {
		"cls": "items",
		"name": "小绿宝石",
		"text": "，护盾+${core.values.greenGem}",
		"itemEffect": "core.status.hero.mdef += 20 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)",
		"itemEffectTip": "，智慧+${20 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)}",
		"useItemEffect": "core.status.hero.mdef += core.values.greenGem",
		"canUseItemEffect": "true"
	},
	"yellowGem": {
		"cls": "items",
		"name": "黄宝石",
		"text": "可以进行加点",
		"itemEffect": "core.status.hero.hp+=1000;core.status.hero.atk+=6;core.status.hero.def+=6;core.status.hero.mdef+=10;",
		"itemEffectTip": "，全属性提升",
		"useItemEvent": [
			{
				"type": "choices",
				"choices": [
					{
						"text": "攻击+1",
						"action": [
							{
								"type": "setValue",
								"name": "status:atk",
								"operator": "+=",
								"value": "1"
							}
						]
					},
					{
						"text": "防御+2",
						"action": [
							{
								"type": "setValue",
								"name": "status:def",
								"operator": "+=",
								"value": "2"
							}
						]
					},
					{
						"text": "生命+200",
						"action": [
							{
								"type": "setValue",
								"name": "status:hp",
								"operator": "+=",
								"value": "200"
							}
						]
					}
				]
			}
		],
		"canUseItemEffect": "true"
	},
	"redPotion": {
		"cls": "items",
		"name": "红血瓶",
		"text": "，生命+${core.values.redPotion}",
		"itemEffect": "core.status.hero.hp += 100 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)",
		"itemEffectTip": "，生命+${100 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)}",
		"useItemEffect": "core.status.hero.hp += core.values.redPotion",
		"canUseItemEffect": "true"
	},
	"bluePotion": {
		"cls": "items",
		"name": "蓝血瓶",
		"text": "，生命+${core.values.bluePotion}",
		"itemEffect": "core.status.hero.hp += 200 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)",
		"itemEffectTip": "，生命+${200 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)}",
		"useItemEffect": "core.status.hero.hp += core.values.bluePotion",
		"canUseItemEffect": "true"
	},
	"yellowPotion": {
		"cls": "items",
		"name": "黄血瓶",
		"text": "，生命+${core.values.yellowPotion}",
		"itemEffect": "core.status.hero.hp += 400 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)",
		"itemEffectTip": "，生命+${400 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)}",
		"useItemEffect": "core.status.hero.hp += core.values.yellowPotion",
		"canUseItemEffect": "true"
	},
	"greenPotion": {
		"cls": "items",
		"name": "绿血瓶",
		"text": "，生命+${core.values.greenPotion}",
		"itemEffect": "core.status.hero.hp += 800 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)",
		"itemEffectTip": "，生命+${800 * core.status.thisMap.ratio  * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)}",
		"useItemEffect": "core.status.hero.hp += core.values.greenPotion",
		"canUseItemEffect": "true"
	},
	"sword0": {
		"cls": "items",
		"name": "破旧的剑",
		"text": "一把已经生锈的剑",
		"equip": {
			"type": 0,
			"animate": "sword",
			"value": {
				"atk": 0
			}
		},
		"itemEffect": "core.status.hero.atk += 0",
		"itemEffectTip": "，攻击+0"
	},
	"sword1": {
		"cls": "equips",
		"name": "智慧之剑",
		"text": "借助曾经闯入此塔的智慧挑战者的智慧锻造而成，攻击+15，额外攻击+10",
		"equip": {
			"type": "武器",
			"animate": "jianji",
			"value": {
				"atk": 15,
				"mana": 10
			},
			"percentage": {}
		},
		"itemEffect": "",
		"itemEffectTip": "，攻击+10"
	},
	"sword2": {
		"cls": "equips",
		"name": "铁剑",
		"text": "真的是一把很普通的银剑，哦不，铁剑。攻击+180，额外攻击+50",
		"equip": {
			"type": 0,
			"animate": "sword",
			"value": {
				"mana": 50,
				"atk": 180
			},
			"percentage": {}
		},
		"itemEffect": "core.status.hero.atk += 20",
		"itemEffectTip": "，攻击+20"
	},
	"sword3": {
		"cls": "items",
		"name": "骑士剑",
		"text": "一把很普通的骑士剑",
		"equip": {
			"type": 0,
			"animate": "sword",
			"value": {
				"atk": 40
			}
		},
		"itemEffect": "core.status.hero.atk += 40",
		"itemEffectTip": "，攻击+40"
	},
	"sword4": {
		"cls": "items",
		"name": "圣剑",
		"text": "一把很普通的圣剑",
		"equip": {
			"type": 0,
			"animate": "sword",
			"value": {
				"atk": 80
			}
		},
		"itemEffect": "core.status.hero.atk += 80",
		"itemEffectTip": "，攻击+80"
	},
	"sword5": {
		"cls": "items",
		"name": "神圣剑",
		"text": "一把很普通的神圣剑",
		"equip": {
			"type": 0,
			"animate": "sword",
			"value": {
				"atk": 160
			}
		},
		"itemEffect": "core.status.hero.atk += 100",
		"itemEffectTip": "，攻击+100"
	},
	"shield0": {
		"cls": "items",
		"name": "破旧的盾",
		"text": "一个很破旧的铁盾",
		"equip": {
			"type": 1,
			"value": {
				"def": 0
			}
		},
		"itemEffect": "core.status.hero.def += 0",
		"itemEffectTip": "，防御+0"
	},
	"shield1": {
		"cls": "equips",
		"name": "智慧之盾",
		"text": "借助曾经闯入此塔的智慧挑战者的智慧锻造而成，防御+15，生命回复+15",
		"equip": {
			"type": "盾牌",
			"value": {
				"hpmax": 15,
				"def": 15
			},
			"percentage": {}
		},
		"itemEffect": "",
		"itemEffectTip": "，防御+10"
	},
	"shield2": {
		"cls": "equips",
		"name": "铁盾",
		"text": "一个真的很普通的铁盾，这次没错了，就是铁盾！防御+120，生命回复+30",
		"equip": {
			"type": 1,
			"value": {
				"hpmax": 30,
				"def": 120
			},
			"percentage": {}
		},
		"itemEffect": "core.status.hero.def += 20",
		"itemEffectTip": "，防御+20"
	},
	"shield3": {
		"cls": "items",
		"name": "骑士盾",
		"text": "一个很普通的骑士盾",
		"equip": {
			"type": 1,
			"value": {
				"def": 40
			}
		},
		"itemEffect": "core.status.hero.def += 40",
		"itemEffectTip": "，防御+40"
	},
	"shield4": {
		"cls": "items",
		"name": "圣盾",
		"text": "一个很普通的圣盾",
		"equip": {
			"type": 1,
			"value": {
				"def": 80
			}
		},
		"itemEffect": "core.status.hero.def += 80",
		"itemEffectTip": "，防御+80"
	},
	"shield5": {
		"cls": "items",
		"name": "神圣盾",
		"text": "一个很普通的神圣盾",
		"equip": {
			"type": 1,
			"value": {
				"def": 100,
				"mdef": 100
			}
		},
		"itemEffect": "core.status.hero.def += 100;core.status.hero.mdef += 100",
		"itemEffectTip": "，防御+100，护盾+100"
	},
	"superPotion": {
		"cls": "items",
		"name": "圣水",
		"itemEffect": "core.status.hero.hp *= 2",
		"itemEffectTip": "，生命值翻倍",
		"useItemEffect": "core.status.hero.hp *= 2;",
		"canUseItemEffect": "true",
		"text": "生命值翻倍"
	},
	"silverCoin": {
		"cls": "items",
		"name": "银币",
		"itemEffect": "core.status.hero.money += 500",
		"itemEffectTip": "，金币+500"
	},
	"book": {
		"cls": "constants",
		"name": "怪物手册",
		"text": "可以查看当前楼层各怪物属性",
		"hideInToolbox": true,
		"useItemEffect": "core.ui.drawBook(0);",
		"canUseItemEffect": "true"
	},
	"fly": {
		"cls": "constants",
		"name": "楼层传送器",
		"text": "可以自由往来去过的楼层",
		"hideInReplay": true,
		"hideInToolbox": true,
		"useItemEffect": "core.ui.drawFly();",
		"canUseItemEffect": "(function () {\n\treturn core.status.maps[core.status.floorId].canFlyFrom;\n})();"
	},
	"coin": {
		"cls": "constants",
		"name": "幸运金币",
		"text": "持有时打败怪物可得双倍金币"
	},
	"freezeBadge": {
		"cls": "constants",
		"name": "冰冻徽章",
		"text": "可以将面前的熔岩变成平地",
		"useItemEffect": "(function () {\n\tvar success = false;\n\n\tvar snowFourDirections = false; // 是否四方向雪花；如果是将其改成true\n\tif (snowFourDirections) {\n\t\t// 四方向雪花\n\t\tfor (var direction in core.utils.scan) {\n\t\t\tvar delta = core.utils.scan[direction];\n\t\t\tvar nx = core.getHeroLoc('x') + delta.x,\n\t\t\t\tny = core.getHeroLoc('y') + delta.y;\n\t\t\tif (core.getBlockId(nx, ny) == 'lava') {\n\t\t\t\tcore.removeBlock(nx, ny);\n\t\t\t\tsuccess = true;\n\t\t\t}\n\t\t}\n\t} else {\n\t\tif (core.getBlockId(core.nextX(), core.nextY()) == 'lava') {\n\t\t\tcore.removeBlock(core.nextX(), core.nextY());\n\t\t\tsuccess = true;\n\t\t}\n\t}\n\n\tif (success) {\n\t\tcore.drawTip(core.material.items[itemId].name + '使用成功');\n\t} else {\n\t\tcore.drawTip(\"当前无法使用\" + core.material.items[itemId].name);\n\t\tcore.addItem(itemId, 1);\n\t\treturn;\n\t}\n})();",
		"canUseItemEffect": "true"
	},
	"cross": {
		"cls": "constants",
		"name": "查看技能",
		"text": "查看勇士的技能",
		"canUseItemEffect": true,
		"useItemEffect": "core.plugin.gameUi.openSkill();"
	},
	"dagger": {
		"cls": "constants",
		"name": "屠龙匕首",
		"text": "该道具尚未被定义"
	},
	"amulet": {
		"cls": "constants",
		"name": "护符",
		"text": "持有时无视负面地形"
	},
	"bigKey": {
		"cls": "tools",
		"name": "大黄门钥匙",
		"text": "可以开启当前层所有黄门",
		"itemEffect": "core.addItem('yellowKey', 1);\ncore.addItem('blueKey', 1);\ncore.addItem('redKey', 1);",
		"itemEffectTip": "，全钥匙+1",
		"useItemEffect": "(function () {\n\tvar actions = core.searchBlock(\"yellowDoor\").map(function (block) {\n\t\treturn { \"type\": \"openDoor\", \"loc\": [block.x, block.y], \"async\": true };\n\t});\n\tactions.push({ \"type\": \"waitAsync\" });\n\tactions.push({ \"type\": \"tip\", \"text\": core.material.items[itemId].name + \"使用成功\" });\n\tcore.insertAction(actions);\n})();",
		"canUseItemEffect": "(function () {\n\treturn core.searchBlock('yellowDoor').length > 0;\n})();"
	},
	"greenKey": {
		"cls": "tools",
		"name": "绿钥匙",
		"text": "可以打开一扇绿门"
	},
	"steelKey": {
		"cls": "tools",
		"name": "铁门钥匙",
		"text": "可以打开一扇铁门"
	},
	"pickaxe": {
		"cls": "tools",
		"name": "破墙镐",
		"text": "可以破坏勇士面前的墙",
		"useItemEffect": "(function () {\n\tvar canBreak = function (x, y) {\n\t\tvar block = core.getBlock(x, y);\n\t\tif (block == null || block.disable) return false;\n\t\treturn block.event.canBreak;\n\t};\n\n\tvar success = false;\n\tvar pickaxeFourDirections = false; // 是否四方向破；如果是将其改成true\n\tif (pickaxeFourDirections) {\n\t\t// 四方向破\n\t\tfor (var direction in core.utils.scan) {\n\t\t\tvar delta = core.utils.scan[direction];\n\t\t\tvar nx = core.getHeroLoc('x') + delta.x,\n\t\t\t\tny = core.getHeroLoc('y') + delta.y;\n\t\t\tif (canBreak(nx, ny)) {\n\t\t\t\tcore.removeBlock(nx, ny);\n\t\t\t\tsuccess = true;\n\t\t\t}\n\t\t}\n\t} else {\n\t\t// 仅破当前\n\t\tif (canBreak(core.nextX(), core.nextY())) {\n\t\t\tcore.removeBlock(core.nextX(), core.nextY());\n\t\t\tsuccess = true;\n\t\t}\n\t}\n\n\tif (success) {\n\t\tcore.playSound('pickaxe.mp3');\n\t\tcore.drawTip(core.material.items[itemId].name + '使用成功');\n\t} else {\n\t\t// 无法使用\n\t\tcore.drawTip(\"当前无法使用\" + core.material.items[itemId].name);\n\t\tcore.addItem(itemId, 1);\n\t\treturn;\n\t}\n})();",
		"canUseItemEffect": "true"
	},
	"icePickaxe": {
		"cls": "tools",
		"name": "破冰镐",
		"text": "可以破坏勇士面前的一堵冰墙",
		"useItemEffect": "(function () {\n\tcore.removeBlock(core.nextX(), core.nextY());\n\tcore.drawTip(core.material.items[itemId].name + '使用成功');\n})();",
		"canUseItemEffect": "(function () {\n\treturn core.getBlockId(core.nextX(), core.nextY()) == 'ice';\n})();"
	},
	"bomb": {
		"cls": "tools",
		"name": "炸弹",
		"text": "可以炸掉勇士面前的怪物",
		"useItemEffect": "(function () {\n\tvar canBomb = function (x, y) {\n\t\tvar block = core.getBlock(x, y);\n\t\tif (block == null || block.disable || block.event.cls.indexOf('enemy') != 0) return false;\n\t\tvar enemy = core.material.enemys[block.event.id];\n\t\treturn enemy && !enemy.notBomb;\n\t};\n\n\tvar bombList = []; // 炸掉的怪物坐标列表\n\tvar bombFourDirections = false; // 是否四方向可炸；如果是将其改成true。\n\tif (bombFourDirections) {\n\t\t// 四方向炸\n\t\tfor (var direction in core.utils.scan) {\n\t\t\tvar delta = core.utils.scan[direction];\n\t\t\tvar nx = core.getHeroLoc('x') + delta.x,\n\t\t\t\tny = core.getHeroLoc('y') + delta.y;\n\t\t\tif (canBomb(nx, ny)) {\n\t\t\t\tbombList.push([nx, ny]);\n\t\t\t\tcore.removeBlock(nx, ny);\n\t\t\t}\n\t\t}\n\t} else {\n\t\t// 仅炸当前\n\t\tif (canBomb(core.nextX(), core.nextY())) {\n\t\t\tbombList.push([core.nextX(), core.nextY()]);\n\t\t\tcore.removeBlock(core.nextX(), core.nextY());\n\t\t}\n\t}\n\n\tif (bombList.length > 0) {\n\t\tcore.playSound('bomb.mp3');\n\t\tcore.drawTip(core.material.items[itemId].name + '使用成功');\n\t} else {\n\t\tcore.drawTip('当前无法使用' + core.material.items[itemId].name);\n\t\tcore.addItem(itemId, 1);\n\t\treturn;\n\t}\n\n\t// 炸弹后事件\n\t// 这是一个使用炸弹也能开门的例子\n\t/*\n\tif (core.status.floorId=='xxx' && core.terrainExists(x0,y0,'specialDoor') // 某个楼层，该机关门存在\n\t\t&& !core.enemyExists(x1,y1) && !core.enemyExists(x2,y2)) // 且守门的怪物都不存在\n\t{\n\t\tcore.insertAction([ // 插入事件\n\t\t\t{\"type\": \"openDoor\", \"loc\": [x0,y0]} // 开门\n\t\t])\n\t}\n\t*/\n})();",
		"canUseItemEffect": "true"
	},
	"centerFly": {
		"cls": "constants",
		"name": "快捷键查看器",
		"text": "可以查看本塔里面的所有快捷键",
		"useItemEffect": "",
		"canUseItemEffect": "true",
		"useItemEvent": [
			"8：打开定点查看界面，如果开启了定点查看代替怪物手册，也可以按X打开定点查看界面\nJ：打开技能树界面\n1：开关断灭之刃技能\n2：使用跳跃技能/破墙镐",
			"平面楼传界面：\n上下左右：移动地图\n,：前移10层\n.：后移10层\nPgUp：上楼\nPgDn：下楼\nB：显隐地图名\nZ：开关3D模式",
			"浏览地图界面（2.8.1新增）：\nG：传送至该地图",
			"手机端：点击右下角难度可以切换至数字键盘"
		]
	},
	"upFly": {
		"cls": "tools",
		"name": "上楼器",
		"text": "可以飞往楼上的相同位置",
		"useItemEffect": "(function () {\n\tvar floorId = core.floorIds[core.floorIds.indexOf(core.status.floorId) + 1];\n\tif (core.status.event.id == 'action') {\n\t\tcore.insertAction([\n\t\t\t{ \"type\": \"changeFloor\", \"loc\": [core.getHeroLoc('x'), core.getHeroLoc('y')], \"floorId\": floorId },\n\t\t\t{ \"type\": \"tip\", \"text\": core.material.items[itemId].name + '使用成功' }\n\t\t]);\n\t} else {\n\t\tcore.changeFloor(floorId, null, core.status.hero.loc, null, function () {\n\t\t\tcore.drawTip(core.material.items[itemId].name + '使用成功');\n\t\t\tcore.replay();\n\t\t});\n\t}\n})();",
		"canUseItemEffect": "(function () {\n\tvar floorId = core.status.floorId,\n\t\tindex = core.floorIds.indexOf(floorId);\n\tif (index < core.floorIds.length - 1) {\n\t\tvar toId = core.floorIds[index + 1],\n\t\t\ttoX = core.getHeroLoc('x'),\n\t\t\ttoY = core.getHeroLoc('y');\n\t\tvar mw = core.floors[toId].width,\n\t\t\tmh = core.floors[toId].height;\n\t\tif (toX >= 0 && toX < mw && toY >= 0 && toY < mh && core.getBlock(toX, toY, toId) == null) {\n\t\t\treturn true;\n\t\t}\n\t}\n\treturn false;\n})();"
	},
	"downFly": {
		"cls": "tools",
		"name": "下楼器",
		"text": "可以飞往楼下的相同位置",
		"useItemEffect": "(function () {\n\tvar floorId = core.floorIds[core.floorIds.indexOf(core.status.floorId) - 1];\n\tif (core.status.event.id == 'action') {\n\t\tcore.insertAction([\n\t\t\t{ \"type\": \"changeFloor\", \"loc\": [core.getHeroLoc('x'), core.getHeroLoc('y')], \"floorId\": floorId },\n\t\t\t{ \"type\": \"tip\", \"text\": core.material.items[itemId].name + '使用成功' }\n\t\t]);\n\t} else {\n\t\tcore.changeFloor(floorId, null, core.status.hero.loc, null, function () {\n\t\t\tcore.drawTip(core.material.items[itemId].name + '使用成功');\n\t\t\tcore.replay();\n\t\t});\n\t}\n})();",
		"canUseItemEffect": "(function () {\n\tvar floorId = core.status.floorId,\n\t\tindex = core.floorIds.indexOf(floorId);\n\tif (index > 0) {\n\t\tvar toId = core.floorIds[index - 1],\n\t\t\ttoX = core.getHeroLoc('x'),\n\t\t\ttoY = core.getHeroLoc('y');\n\t\tvar mw = core.floors[toId].width,\n\t\t\tmh = core.floors[toId].height;\n\t\tif (toX >= 0 && toX < mw && toY >= 0 && toY < mh && core.getBlock(toX, toY, toId) == null) {\n\t\t\treturn true;\n\t\t}\n\t}\n\treturn false;\n})();"
	},
	"earthquake": {
		"cls": "tools",
		"name": "地震卷轴",
		"text": "可以破坏当前层的所有墙",
		"useItemEffect": "(function () {\n\tvar indexes = [];\n\tfor (var index in core.status.thisMap.blocks) {\n\t\tvar block = core.status.thisMap.blocks[index];\n\t\tif (!block.disable && block.event.canBreak) {\n\t\t\tindexes.push(index);\n\t\t}\n\t}\n\tcore.removeBlockByIndexes(indexes);\n\tcore.drawMap();\n\tcore.drawTip(core.material.items[itemId].name + '使用成功');\n})();",
		"canUseItemEffect": "(function () {\n\treturn core.status.thisMap.blocks.filter(function (block) {\n\t\treturn !block.disable && block.event.canBreak;\n\t}).length > 0;\n})();"
	},
	"poisonWine": {
		"cls": "tools",
		"name": "解毒药水",
		"text": "可以解除中毒状态",
		"useItemEffect": "",
		"canUseItemEffect": "core.hasFlag('poison');"
	},
	"weakWine": {
		"cls": "tools",
		"name": "解衰药水",
		"text": "可以解除衰弱状态",
		"useItemEffect": "",
		"canUseItemEffect": "core.hasFlag('weak');"
	},
	"curseWine": {
		"cls": "tools",
		"name": "解咒药水",
		"text": "可以解除诅咒状态",
		"useItemEffect": "",
		"canUseItemEffect": "core.hasFlag('curse');"
	},
	"superWine": {
		"cls": "tools",
		"name": "万能药水",
		"text": "可以解除所有不良状态",
		"useItemEffect": "",
		"canUseItemEffect": "(function() {\n\treturn core.hasFlag('poison') || core.hasFlag('weak') || core.hasFlag('curse');\n})();"
	},
	"hammer": {
		"cls": "tools",
		"name": "圣锤",
		"text": "该道具尚未被定义"
	},
	"lifeWand": {
		"cls": "tools",
		"name": "生命魔杖",
		"text": "可以恢复100点生命值",
		"useItemEvent": [
			{
				"type": "comment",
				"text": "先恢复一个魔杖（因为使用道具必须消耗一个）"
			},
			{
				"type": "function",
				"function": "function(){\ncore.addItem('lifeWand', 1);\n}"
			},
			{
				"type": "input",
				"text": "请输入生命魔杖使用次数：(0-${item:lifeWand})"
			},
			{
				"type": "if",
				"condition": "flag:input<=item:lifeWand",
				"true": [
					{
						"type": "setValue",
						"name": "item:lifeWand",
						"operator": "-=",
						"value": "flag:input"
					},
					{
						"type": "setValue",
						"name": "status:hp",
						"operator": "+=",
						"value": "flag:input*100"
					},
					"成功使用${flag:input}次生命魔杖，恢复${flag:input*100}点生命。"
				],
				"false": [
					"输入不合法！"
				]
			}
		],
		"canUseItemEffect": "true"
	},
	"jumpShoes": {
		"cls": "tools",
		"name": "跳跃靴",
		"text": "能跳跃到前方两格处",
		"useItemEffect": "core.playSound(\"jump.mp3\"); core.insertAction({ \"type\": \"jumpHero\", \"loc\": [core.nextX(2), core.nextY(2)] });",
		"canUseItemEffect": "(function () {\n\tvar nx = core.nextX(2),\n\t\tny = core.nextY(2);\n\treturn nx >= 0 && nx < core.bigmap.width && ny >= 0 && ny < core.bigmap.height && core.getBlockId(nx, ny) == null;\n})();"
	},
	"skill1": {
		"cls": "constants",
		"name": "技能树",
		"text": "打开技能树",
		"hideInReplay": true,
		"useItemEffect": "core.plugin.skillTree.openTree();",
		"canUseItemEffect": "true"
	},
	"wand": {
		"cls": "constants",
		"name": "定点查看",
		"text": "可以定点查看怪物属性",
		"canUseItemEffect": true,
		"useItemEffect": "core.openFixed();"
	},
	"I319": {
		"cls": "items",
		"name": "新物品"
	},
	"I320": {
		"cls": "items",
		"name": "新物品"
	},
	"I321": {
		"cls": "items",
		"name": "新物品"
	},
	"I322": {
		"cls": "constants",
		"name": "快捷键查看器",
		"text": "可以查看本塔里面的所有快捷键",
		"useItemEffect": "",
		"canUseItemEffect": "true",
		"useItemEvent": [
			"8：打开定点查看界面，如果开启了定点查看代替怪物手册，也可以按X打开定点查看界面\nJ：打开技能树界面\n1：开关断灭之刃技能\n2：使用跳跃技能/破墙镐",
			"平面楼传界面：\n上下左右：移动地图\n,：前移10层\n.：后移10层\nPgUp：上楼\nPgDn：下楼\nB：显隐地图名\nZ：开关3D模式",
			"浏览地图界面（2.8.1新增）：\nG：传送至该地图",
			"手机端：点击右下角难度可以切换至数字键盘"
		]
	},
	"I323": {
		"cls": "items",
		"name": "新物品"
	},
	"I324": {
		"cls": "items",
		"name": "新物品"
	},
	"I325": {
		"cls": "items",
		"name": "新物品"
	},
	"I326": {
		"cls": "items",
		"name": "新物品"
	},
	"I327": {
		"cls": "items",
		"name": "新物品"
	},
	"I328": {
		"cls": "items",
		"name": "新物品"
	},
	"I329": {
		"cls": "items",
		"name": "新物品"
	},
	"I330": {
		"cls": "constants",
		"name": "系统设置",
		"text": "可以修改一些本塔的设置",
		"canUseItemEffect": true,
		"useItemEvent": null
	},
	"I376": {
		"cls": "items",
		"name": "中红宝石",
		"text": "攻击+${core.values.redGem}",
		"itemEffect": "core.status.hero.atk += 2 * core.status.thisMap.ratio",
		"itemEffectTip": "，攻击+${2 * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.atk += core.values.redGem",
		"canUseItemEffect": "true"
	},
	"I377": {
		"cls": "items",
		"name": "新物品"
	},
	"I378": {
		"cls": "items",
		"name": "中蓝宝石",
		"text": "，防御+${core.values.blueGem}",
		"itemEffect": "core.status.hero.def += 2 * core.status.thisMap.ratio",
		"itemEffectTip": "，防御+${2 * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.def += core.values.blueGem",
		"canUseItemEffect": "true"
	},
	"I379": {
		"cls": "items",
		"name": "新物品"
	},
	"I380": {
		"cls": "items",
		"name": "新物品"
	},
	"I381": {
		"cls": "items",
		"name": "中绿宝石",
		"text": "，护盾+${core.values.greenGem}",
		"itemEffect": "core.status.hero.mdef += 40 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)",
		"itemEffectTip": "，智慧+${40 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)}",
		"useItemEffect": "core.status.hero.mdef += core.values.greenGem",
		"canUseItemEffect": "true"
	},
	"I382": {
		"cls": "items",
		"name": "新物品"
	},
	"I383": {
		"cls": "items",
		"name": "新物品"
	},
	"I384": {
		"cls": "items",
		"name": "新物品"
	},
	"I385": {
		"cls": "items",
		"name": "新物品"
	},
	"I386": {
		"cls": "items",
		"name": "新物品"
	},
	"I387": {
		"cls": "items",
		"name": "新物品"
	},
	"I388": {
		"cls": "items",
		"name": "新物品"
	},
	"I389": {
		"cls": "items",
		"name": "新物品"
	},
	"I390": {
		"cls": "items",
		"name": "大红宝石",
		"text": "攻击+${core.values.redGem}",
		"itemEffect": "core.status.hero.atk += 4 * core.status.thisMap.ratio",
		"itemEffectTip": "，攻击+${4 * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.atk += core.values.redGem",
		"canUseItemEffect": "true"
	},
	"I391": {
		"cls": "items",
		"name": "新物品"
	},
	"I392": {
		"cls": "items",
		"name": "新物品"
	},
	"I393": {
		"cls": "items",
		"name": "新物品"
	},
	"I394": {
		"cls": "items",
		"name": "新物品"
	},
	"I395": {
		"cls": "items",
		"name": "新物品"
	},
	"I396": {
		"cls": "items",
		"name": "大蓝宝石",
		"text": "，防御+${core.values.blueGem}",
		"itemEffect": "core.status.hero.def += 4 * core.status.thisMap.ratio",
		"itemEffectTip": "，防御+${4 * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.def += core.values.blueGem",
		"canUseItemEffect": "true"
	},
	"I397": {
		"cls": "items",
		"name": "新物品"
	},
	"I398": {
		"cls": "items",
		"name": "新物品"
	},
	"I399": {
		"cls": "items",
		"name": "新物品"
	},
	"I400": {
		"cls": "items",
		"name": "新物品"
	},
	"I401": {
		"cls": "items",
		"name": "新物品"
	},
	"I402": {
		"cls": "items",
		"name": "新物品"
	},
	"I403": {
		"cls": "items",
		"name": "大绿宝石",
		"text": "，护盾+${core.values.greenGem}",
		"itemEffect": "core.status.hero.mdef += 80 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)",
		"itemEffectTip": "，智慧+${80 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)}",
		"useItemEffect": "core.status.hero.mdef += core.values.greenGem",
		"canUseItemEffect": "true"
	},
	"I404": {
		"cls": "items",
		"name": "新物品"
	},
	"I405": {
		"cls": "items",
		"name": "新物品"
	},
	"I406": {
		"cls": "items",
		"name": "新物品"
	},
	"I407": {
		"cls": "items",
		"name": "新物品"
	},
	"I408": {
		"cls": "items",
		"name": "新物品"
	},
	"I409": {
		"cls": "items",
		"name": "新物品"
	},
	"I410": {
		"cls": "items",
		"name": "新物品"
	},
	"I411": {
		"cls": "items",
		"name": "新物品"
	},
	"I412": {
		"cls": "items",
		"name": "新物品"
	},
	"I413": {
		"cls": "items",
		"name": "新物品"
	},
	"I414": {
		"cls": "items",
		"name": "新物品"
	},
	"I415": {
		"cls": "items",
		"name": "新物品"
	},
	"I416": {
		"cls": "items",
		"name": "新物品"
	},
	"I417": {
		"cls": "items",
		"name": "新物品"
	},
	"I418": {
		"cls": "items",
		"name": "新物品"
	},
	"I419": {
		"cls": "items",
		"name": "新物品"
	},
	"I420": {
		"cls": "items",
		"name": "超大红宝石",
		"text": "攻击+${core.values.redGem}",
		"itemEffect": "core.status.hero.atk += 8 * core.status.thisMap.ratio",
		"itemEffectTip": "，攻击+${8 * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.atk += core.values.redGem",
		"canUseItemEffect": "true"
	},
	"I421": {
		"cls": "items",
		"name": "新物品"
	},
	"I422": {
		"cls": "items",
		"name": "新物品"
	},
	"I423": {
		"cls": "items",
		"name": "新物品"
	},
	"I424": {
		"cls": "items",
		"name": "新物品"
	},
	"I425": {
		"cls": "items",
		"name": "新物品"
	},
	"I426": {
		"cls": "items",
		"name": "新物品"
	},
	"I427": {
		"cls": "items",
		"name": "新物品"
	},
	"I428": {
		"cls": "items",
		"name": "新物品"
	},
	"I429": {
		"cls": "items",
		"name": "新物品"
	},
	"I430": {
		"cls": "items",
		"name": "超大蓝宝石",
		"text": "，防御+${core.values.blueGem}",
		"itemEffect": "core.status.hero.def += 8 * core.status.thisMap.ratio",
		"itemEffectTip": "，防御+${8 * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.def += core.values.blueGem",
		"canUseItemEffect": "true"
	},
	"I431": {
		"cls": "items",
		"name": "新物品"
	},
	"I432": {
		"cls": "items",
		"name": "新物品"
	},
	"I433": {
		"cls": "items",
		"name": "新物品"
	},
	"I434": {
		"cls": "items",
		"name": "新物品"
	},
	"I435": {
		"cls": "items",
		"name": "新物品"
	},
	"I436": {
		"cls": "items",
		"name": "新物品"
	},
	"I437": {
		"cls": "items",
		"name": "新物品"
	},
	"I438": {
		"cls": "items",
		"name": "新物品"
	},
	"I439": {
		"cls": "items",
		"name": "新物品"
	},
	"I440": {
		"cls": "items",
		"name": "新物品"
	},
	"I441": {
		"cls": "items",
		"name": "超大绿宝石",
		"text": "，护盾+${core.values.greenGem}",
		"itemEffect": "core.status.hero.mdef += 160 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)",
		"itemEffectTip": "，智慧+${160 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)}",
		"useItemEffect": "core.status.hero.mdef += core.values.greenGem",
		"canUseItemEffect": "true"
	},
	"I442": {
		"cls": "items",
		"name": "新物品"
	},
	"I443": {
		"cls": "items",
		"name": "新物品"
	},
	"I444": {
		"cls": "items",
		"name": "新物品"
	},
	"I445": {
		"cls": "items",
		"name": "新物品"
	},
	"I446": {
		"cls": "items",
		"name": "新物品"
	},
	"I447": {
		"cls": "items",
		"name": "新物品"
	},
	"I448": {
		"cls": "items",
		"name": "新物品"
	},
	"I449": {
		"cls": "items",
		"name": "新物品"
	},
	"I450": {
		"cls": "items",
		"name": "新物品"
	},
	"I451": {
		"cls": "items",
		"name": "新物品"
	},
	"I452": {
		"cls": "items",
		"name": "新物品"
	},
	"I453": {
		"cls": "items",
		"name": "新物品"
	},
	"I454": {
		"cls": "items",
		"name": "新物品"
	},
	"I455": {
		"cls": "items",
		"name": "新物品"
	},
	"I456": {
		"cls": "items",
		"name": "新物品"
	},
	"I457": {
		"cls": "items",
		"name": "新物品"
	},
	"I458": {
		"cls": "items",
		"name": "新物品"
	},
	"I459": {
		"cls": "items",
		"name": "新物品"
	},
	"I460": {
		"cls": "items",
		"name": "新物品"
	},
	"I461": {
		"cls": "items",
		"name": "新物品"
	},
	"I462": {
		"cls": "items",
		"name": "新物品"
	},
	"I463": {
		"cls": "items",
		"name": "新物品"
	},
	"I464": {
		"cls": "items",
		"name": "新物品"
	},
	"I465": {
		"cls": "items",
		"name": "新物品"
	},
	"I466": {
		"cls": "items",
		"name": "璀璨红宝石",
		"text": "攻击+${core.values.redGem}",
		"itemEffect": "core.status.hero.atk += 16 * core.status.thisMap.ratio",
		"itemEffectTip": "，攻击+${16 * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.atk += core.values.redGem",
		"canUseItemEffect": "true"
	},
	"I467": {
		"cls": "items",
		"name": "璀璨蓝宝石",
		"text": "，防御+${core.values.blueGem}",
		"itemEffect": "core.status.hero.def += 16 * core.status.thisMap.ratio",
		"itemEffectTip": "，防御+${16 * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.def += core.values.blueGem",
		"canUseItemEffect": "true"
	},
	"I468": {
		"cls": "items",
		"name": "璀璨绿宝石",
		"text": "，护盾+${core.values.greenGem}",
		"itemEffect": "core.status.hero.mdef += 320 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)",
		"itemEffectTip": "，智慧+${320 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)}",
		"useItemEffect": "core.status.hero.mdef += core.values.greenGem",
		"canUseItemEffect": "true"
	},
	"I469": {
		"cls": "items",
		"name": "新物品"
	},
	"I470": {
		"cls": "items",
		"name": "新物品",
		"text": "攻击+${core.values.redGem}",
		"itemEffect": "core.status.hero.atk += 32 * core.status.thisMap.ratio",
		"itemEffectTip": "，攻击+${32 * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.atk += core.values.redGem",
		"canUseItemEffect": "true"
	},
	"I471": {
		"cls": "items",
		"name": "新物品",
		"text": "，防御+${core.values.blueGem}",
		"itemEffect": "core.status.hero.def += 32 * core.status.thisMap.ratio",
		"itemEffectTip": "，防御+${32 * core.status.thisMap.ratio}",
		"useItemEffect": "core.status.hero.def += core.values.blueGem",
		"canUseItemEffect": "true"
	},
	"I472": {
		"cls": "items",
		"name": "新物品",
		"text": "，防御+${core.values.blueGem}",
		"itemEffect": "core.status.hero.mdef += 640 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)",
		"itemEffectTip": "，智慧+${640 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)}",
		"useItemEffect": "core.status.hero.def += core.values.blueGem",
		"canUseItemEffect": "true"
	},
	"I473": {
		"cls": "items",
		"name": "新物品"
	},
	"I474": {
		"cls": "items",
		"name": "新物品"
	},
	"I475": {
		"cls": "items",
		"name": "新物品"
	},
	"I476": {
		"cls": "items",
		"name": "史诗绿宝石",
		"text": "，护盾+${core.values.greenGem}",
		"itemEffect": "core.status.hero.mdef += 1280 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)",
		"itemEffectTip": "，智慧+${1280 * core.status.thisMap.ratio / core.getFlag(\"hard\") * (core.plugin.skillTree.getSkillLevel(12) / 20 + 1)}",
		"useItemEffect": "core.status.hero.mdef += core.values.greenGem",
		"canUseItemEffect": "true"
	},
	"I477": {
		"cls": "items",
		"name": "新物品"
	},
	"I478": {
		"cls": "items",
		"name": "新物品"
	},
	"I479": {
		"cls": "items",
		"name": "新物品"
	},
	"I480": {
		"cls": "items",
		"name": "新物品"
	},
	"I481": {
		"cls": "items",
		"name": "新物品"
	},
	"I482": {
		"cls": "items",
		"name": "大红血瓶",
		"text": "，生命+${core.values.redPotion}",
		"itemEffect": "core.status.hero.hp += 1000 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)",
		"itemEffectTip": "，生命+${1000 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)}",
		"useItemEffect": "core.status.hero.hp += core.values.redPotion",
		"canUseItemEffect": "true"
	},
	"I483": {
		"cls": "items",
		"name": "新物品"
	},
	"I484": {
		"cls": "items",
		"name": "大蓝血瓶",
		"text": "，生命+${core.values.redPotion}",
		"itemEffect": "core.status.hero.hp += 2000 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)",
		"itemEffectTip": "，生命+${2000 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)}",
		"useItemEffect": "core.status.hero.hp += core.values.redPotion",
		"canUseItemEffect": "true"
	},
	"I485": {
		"cls": "items",
		"name": "新物品"
	},
	"I486": {
		"cls": "items",
		"name": "新物品"
	},
	"I487": {
		"cls": "items",
		"name": "大绿血瓶",
		"text": "，生命+${core.values.redPotion}",
		"itemEffect": "core.status.hero.hp += 8000 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)",
		"itemEffectTip": "，生命+${8000 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)}",
		"useItemEffect": "core.status.hero.hp += core.values.redPotion",
		"canUseItemEffect": "true"
	},
	"I488": {
		"cls": "items",
		"name": "新物品"
	},
	"I489": {
		"cls": "items",
		"name": "新物品"
	},
	"I490": {
		"cls": "items",
		"name": "新物品"
	},
	"I491": {
		"cls": "items",
		"name": "大黄血瓶",
		"text": "，生命+${core.values.redPotion}",
		"itemEffect": "core.status.hero.hp += 4000 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)",
		"itemEffectTip": "，生命+${4000 * core.status.thisMap.ratio * (1 + core.plugin.skillTree.getSkillLevel(13) / 50)}",
		"useItemEffect": "core.status.hero.hp += core.values.redPotion",
		"canUseItemEffect": "true"
	},
	"I558": {
		"cls": "constants",
		"name": "bgm查看器",
		"canUseItemEffect": "true",
		"text": "可以查看游戏内你已经听过的bgm，歌曲名格式：歌手——歌曲名。未完工。",
		"useItemEffect": "mota.plugin.utils.tip('warn', '当前道具还未制作完成！');\n// mota.ui.main.open('bgm');"
	},
	"I559": {
		"cls": "constants",
		"name": "系统设置",
		"canUseItemEffect": "true",
		"text": "内含所有系统设置项",
		"useItemEffect": "if (!core.isReplaying()) Mota.require('var', 'mainUi').open('settings');"
	},
	"I560": {
		"cls": "constants",
		"name": "百科全书",
		"canUseItemEffect": "true",
		"text": "一个包含游戏中所有功能详细说明的百科全书，可以查看游戏中所有的功能",
		"useItemEffect": "if (!core.isReplaying()) Mota.require('var', 'mainUi').open('desc');"
	},
	"I565": {
		"cls": "constants",
		"name": "学习",
		"canUseItemEffect": "true",
		"text": "可以学习怪物的技能，学习后持续${core.plugin.skillTree.getSkillLevel(11) * 3 + 2}场战斗"
	},
	"I574": {
		"cls": "items",
		"name": "新物品",
		"canUseItemEffect": "true"
	},
	"I575": {
		"cls": "equips",
		"name": "智慧之靴",
		"canUseItemEffect": "true",
		"text": "用智慧制作出的靴子，穿上后增加10%的攻击力和10%的防御",
		"equip": {
			"type": "鞋子",
			"value": {},
			"percentage": {
				"def": 10,
				"atk": 10
			}
		}
	},
	"I589": {
		"cls": "equips",
		"name": "杰克的衣服",
		"canUseItemEffect": "true",
		"text": "杰克为主角留下的衣服，可以抵御寒冷。防御+25，免疫怪物的霜冻属性。",
		"equip": {
			"type": "衣服",
			"value": {
				"def": 25
			},
			"percentage": {}
		}
	},
	"I641": {
		"cls": "equips",
		"name": "寒冰护符",
		"canUseItemEffect": "true",
		"text": "!!html<span style=\"color: gold\">饰品</span>。与寒冰没有任何关系，但是为什么叫寒冰护符呢？攻击和额外攻击各增加5%",
		"equip": {
			"type": "首饰",
			"value": {},
			"percentage": {
				"mana": 5,
				"atk": 5
			}
		}
	},
	"I642": {
		"cls": "constants",
		"name": "成就",
		"canUseItemEffect": "true",
		"useItemEffect": "Mota.require('var', 'mainUi')open('achievement');",
		"text": "可以查看成就"
	}
}