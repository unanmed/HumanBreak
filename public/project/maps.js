var maps_90f36752_8815_4be8_b32b_d7fad1d0542e = 
{
	"1": {"cls":"animates","id":"yellowWall","canBreak":true,"animate":1,"doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{}}},
	"2": {"cls":"animates","id":"whiteWall","canBreak":true,"animate":1,"doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{}}},
	"3": {"cls":"animates","id":"blueWall","canBreak":true,"animate":1,"doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{}}},
	"4": {"cls":"animates","id":"star","name":"星空"},
	"5": {"cls":"animates","id":"lava","name":"岩浆"},
	"6": {"cls":"terrains","id":"ice"},
	"7": {"cls":"terrains","id":"blueShopLeft"},
	"8": {"cls":"terrains","id":"blueShopRight"},
	"9": {"cls":"terrains","id":"pinkShopLeft"},
	"10": {"cls":"terrains","id":"pinkShopRight"},
	"11": {"cls":"animates","id":"lavaNet","canPass":true,"trigger":"null","script":"(function () {\n\t// 血网的伤害效果移动到 checkBlock 中处理\n\n\t// 如果要做一次性血网，可直接注释掉下面这句话：\n\t// core.removeBlock(core.getHeroLoc('x'), core.getHeroLoc('y'));\n})();","name":"血网"},
	"12": {"cls":"animates","id":"poisonNet","canPass":true,"trigger":"null","script":"(function () {\n\tif (!core.hasItem('amulet')) {\n\t\tcore.triggerDebuff('get', 'poison');\n\t\tcore.updateStatusBar();\n\t}\n\n\t// 如果要做一次性毒网，可直接注释掉下面这句话：\n\t// core.removeBlock(core.getHeroLoc('x'), core.getHeroLoc('y'));\n})()","name":"毒网"},
	"13": {"cls":"animates","id":"weakNet","canPass":true,"trigger":"null","script":"(function () {\n\tif (!core.hasItem('amulet')) {\n\t\tcore.triggerDebuff('get', 'weak');\n\t\tcore.updateStatusBar();\n\t}\n\n\t// 如果要做一次性衰网，可直接注释掉下面这句话：\n\t// core.removeBlock(core.getHeroLoc('x'), core.getHeroLoc('y'));\n})()","name":"衰网"},
	"14": {"cls":"animates","id":"curseNet","canPass":true,"trigger":"null","script":"(function () {\n\tif (!core.hasItem('amulet')) {\n\t\tcore.triggerDebuff('get', 'curse');\n\t\tcore.updateStatusBar();\n\t}\n\n\t// 如果要做一次性咒网，可直接注释掉下面这句话：\n\t// core.removeBlock(core.getHeroLoc('x'), core.getHeroLoc('y'));\n})()","name":"咒网"},
	"15": {"cls":"animates","id":"blueWater"},
	"16": {"cls":"animates","id":"water"},
	"20": {"cls":"autotile","id":"autotile"},
	"21": {"cls":"items","id":"yellowKey"},
	"22": {"cls":"items","id":"blueKey"},
	"23": {"cls":"items","id":"redKey"},
	"24": {"cls":"items","id":"greenKey"},
	"25": {"cls":"items","id":"steelKey"},
	"26": {"cls":"items","id":"bigKey"},
	"27": {"cls":"items","id":"redGem"},
	"28": {"cls":"items","id":"blueGem"},
	"29": {"cls":"items","id":"greenGem"},
	"30": {"cls":"items","id":"yellowGem"},
	"31": {"cls":"items","id":"redPotion"},
	"32": {"cls":"items","id":"bluePotion"},
	"33": {"cls":"items","id":"greenPotion"},
	"34": {"cls":"items","id":"yellowPotion"},
	"35": {"cls":"items","id":"sword1"},
	"36": {"cls":"items","id":"shield1"},
	"37": {"cls":"items","id":"sword2"},
	"38": {"cls":"items","id":"shield2"},
	"39": {"cls":"items","id":"sword3"},
	"40": {"cls":"items","id":"shield3"},
	"41": {"cls":"items","id":"sword4"},
	"42": {"cls":"items","id":"shield4"},
	"43": {"cls":"items","id":"sword5"},
	"44": {"cls":"items","id":"shield5"},
	"45": {"cls":"items","id":"book"},
	"46": {"cls":"items","id":"fly"},
	"47": {"cls":"items","id":"pickaxe"},
	"48": {"cls":"items","id":"icePickaxe"},
	"49": {"cls":"items","id":"bomb"},
	"50": {"cls":"items","id":"centerFly"},
	"51": {"cls":"items","id":"upFly"},
	"52": {"cls":"items","id":"downFly"},
	"53": {"cls":"items","id":"coin"},
	"54": {"cls":"items","id":"freezeBadge"},
	"55": {"cls":"items","id":"cross"},
	"56": {"cls":"items","id":"superPotion"},
	"57": {"cls":"items","id":"earthquake"},
	"58": {"cls":"items","id":"poisonWine"},
	"59": {"cls":"items","id":"weakWine"},
	"60": {"cls":"items","id":"curseWine"},
	"61": {"cls":"items","id":"superWine"},
	"62": {"cls":"items","id":"dagger"},
	"63": {"cls":"items","id":"silverCoin"},
	"64": {"cls":"items","id":"amulet"},
	"65": {"cls":"items","id":"hammer"},
	"68": {"cls":"items","id":"lifeWand"},
	"69": {"cls":"items","id":"jumpShoes"},
	"70": {"cls":"items","id":"sword0"},
	"71": {"cls":"items","id":"shield0"},
	"72": {"cls":"items","id":"skill1"},
	"73": {"cls":"items","id":"wand"},
	"81": {"cls":"animates","id":"yellowDoor","trigger":"openDoor","animate":1,"doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{"yellowKey":1}},"name":"黄门"},
	"82": {"cls":"animates","id":"blueDoor","trigger":"openDoor","animate":1,"doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{"blueKey":1}},"name":"蓝门"},
	"83": {"cls":"animates","id":"redDoor","trigger":"openDoor","animate":1,"doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{"redKey":1}},"name":"红门"},
	"84": {"cls":"animates","id":"greenDoor","trigger":"openDoor","animate":1,"doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{"greenKey":1}},"name":"绿门"},
	"85": {"cls":"animates","id":"specialDoor","trigger":"openDoor","animate":1,"doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{"specialKey":1}},"name":"机关门"},
	"86": {"cls":"animates","id":"steelDoor","trigger":"openDoor","animate":1,"doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{"steelKey":1}},"name":"铁门"},
	"87": {"cls":"terrains","id":"upFloor","canPass":true},
	"88": {"cls":"terrains","id":"downFloor","canPass":true},
	"89": {"cls":"animates","id":"portal","canPass":true},
	"90": {"cls":"animates","id":"starPortal","canPass":true},
	"91": {"cls":"animates","id":"upPortal","canPass":true},
	"92": {"cls":"animates","id":"leftPortal","canPass":true},
	"93": {"cls":"animates","id":"downPortal","canPass":true},
	"94": {"cls":"animates","id":"rightPortal","canPass":true},
	"101": {"cls":"animates","id":"crystalUp"},
	"102": {"cls":"animates","id":"crystalBottom"},
	"103": {"cls":"animates","id":"fire"},
	"104": {"cls":"animates","id":"switch"},
	"105": {"cls":"animates","id":"steelDoor2","doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{}},"animate":1,"trigger":"openDoor"},
	"106": {"cls":"animates","id":"steelDoor3","doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{}},"animate":1,"trigger":"openDoor"},
	"107": {"cls":"animates","id":"iceDoor","doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{}},"animate":1,"trigger":"openDoor"},
	"108": {"cls":"animates","id":"iceDoor2","doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{}},"animate":1,"trigger":"openDoor"},
	"109": {"cls":"animates","id":"magentaWall","canBreak":true,"animate":1,"doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{}}},
	"121": {"cls":"npcs","id":"man"},
	"122": {"cls":"npcs","id":"trader"},
	"123": {"cls":"npcs","id":"thief"},
	"124": {"cls":"npcs","id":"fairy"},
	"125": {"cls":"npcs","id":"wizard"},
	"126": {"cls":"npcs","id":"recluse"},
	"127": {"cls":"npcs","id":"king"},
	"128": {"cls":"npcs","id":"youngMan"},
	"129": {"cls":"npcs","id":"sign"},
	"130": {"cls":"npcs","id":"expShop"},
	"131": {"cls":"npcs","id":"moneyShop"},
	"132": {"cls":"npcs","id":"princess"},
	"133": {"cls":"npc48","id":"npc0","faceIds":{"down":"npc0","left":"npc1","right":"npc2","up":"npc3"},"animate":1},
	"134": {"cls":"npc48","id":"npc1","faceIds":{"down":"npc0","left":"npc1","right":"npc2","up":"npc3"},"animate":1},
	"135": {"cls":"npc48","id":"npc2","faceIds":{"down":"npc0","left":"npc1","right":"npc2","up":"npc3"},"animate":1},
	"136": {"cls":"npc48","id":"npc3","faceIds":{"down":"npc0","left":"npc1","right":"npc2","up":"npc3"},"animate":1},
	"137": {"cls":"npcs","id":"greenMan"},
	"138": {"cls":"npcs","id":"blueTrader","faceIds":{"down":"blueTrader","left":"redMSNpc","right":"blackTrader","up":"N532"}},
	"139": {"cls":"npcs","id":"redMSNpc","faceIds":{"down":"blueTrader","left":"redMSNpc","right":"blackTrader","up":"N532"}},
	"140": {"cls":"npcs","id":"blackTrader","faceIds":{"down":"blueTrader","left":"redMSNpc","right":"blackTrader","up":"N532"}},
	"141": {"cls":"autotile","id":"autotile4","script":1},
	"142": {"cls":"autotile","id":"autotile5"},
	"143": {"cls":"autotile","id":"autotile6"},
	"144": {"cls":"autotile","id":"autotile7"},
	"145": {"cls":"autotile","id":"autotile8"},
	"146": {"cls":"autotile","id":"autotile9","canPass":true},
	"147": {"cls":"autotile","id":"autotile10"},
	"151": {"cls":"autotile","id":"autotile1"},
	"152": {"cls":"autotile","id":"autotile2"},
	"153": {"cls":"autotile","id":"autotile3"},
	"161": {"cls":"terrains","id":"arrowUp","canPass":true,"cannotOut":["left","right","down"],"cannotIn":["up"]},
	"162": {"cls":"terrains","id":"arrowDown","canPass":true,"cannotOut":["left","right","up"],"cannotIn":["down"]},
	"163": {"cls":"terrains","id":"arrowLeft","canPass":true,"cannotOut":["up","down","right"],"cannotIn":["left"]},
	"164": {"cls":"terrains","id":"arrowRight","canPass":true,"cannotOut":["up","down","left"],"cannotIn":["right"]},
	"165": {"cls":"terrains","id":"light","trigger":"null","canPass":true,"script":"(function () {\n\tcore.setBlock(core.getNumberById('darkLight'), core.getHeroLoc('x'), core.getHeroLoc('y'));\n})();"},
	"166": {"cls":"terrains","id":"darkLight"},
	"167": {"cls":"terrains","id":"ski","trigger":"ski","canPass":true},
	"168": {"cls":"terrains","id":"flower","canPass":true},
	"169": {"cls":"terrains","id":"box","trigger":"pushBox"},
	"170": {"cls":"terrains","id":"boxed","trigger":"pushBox"},
	"181": {"cls":"npcs","id":"octopusLeftTop"},
	"182": {"cls":"npcs","id":"octopusTop"},
	"183": {"cls":"npcs","id":"octopusRightTop"},
	"184": {"cls":"npcs","id":"octopusLeft"},
	"185": {"cls":"npcs","id":"octopusCenter"},
	"186": {"cls":"npcs","id":"octopusRight"},
	"187": {"cls":"npcs","id":"octopusLeftBottom"},
	"188": {"cls":"npcs","id":"octopusRightBottom"},
	"189": {"cls":"npcs","id":"dragonLeftTop"},
	"190": {"cls":"npcs","id":"dragonTop"},
	"191": {"cls":"npcs","id":"dragonRightTop"},
	"192": {"cls":"npcs","id":"dragonLeft"},
	"193": {"cls":"npcs","id":"dragonCenter"},
	"194": {"cls":"npcs","id":"dragonRight"},
	"195": {"cls":"npcs","id":"dragonLeftBottom"},
	"196": {"cls":"npcs","id":"dragonRightBottom"},
	"201": {"cls":"enemys","id":"greenSlime"},
	"202": {"cls":"enemys","id":"redSlime"},
	"203": {"cls":"enemys","id":"blackSlime"},
	"204": {"cls":"enemys","id":"slimelord"},
	"205": {"cls":"enemys","id":"bat"},
	"206": {"cls":"enemys","id":"bigBat"},
	"207": {"cls":"enemys","id":"redBat"},
	"208": {"cls":"enemys","id":"vampire"},
	"209": {"cls":"enemys","id":"skeleton"},
	"210": {"cls":"enemys","id":"skeletonWarrior"},
	"211": {"cls":"enemys","id":"skeletonCaptain"},
	"212": {"cls":"enemys","id":"ghostSoldier"},
	"213": {"cls":"enemys","id":"zombie"},
	"214": {"cls":"enemys","id":"zombieKnight"},
	"215": {"cls":"enemys","id":"rock"},
	"216": {"cls":"enemys","id":"slimeman"},
	"217": {"cls":"enemys","id":"bluePriest"},
	"218": {"cls":"enemys","id":"redPriest"},
	"219": {"cls":"enemys","id":"brownWizard"},
	"220": {"cls":"enemys","id":"redWizard"},
	"221": {"cls":"enemys","id":"yellowGateKeeper"},
	"222": {"cls":"enemys","id":"blueGateKeeper"},
	"223": {"cls":"enemys","id":"redGateKeeper"},
	"224": {"cls":"enemys","id":"swordsman"},
	"225": {"cls":"enemys","id":"soldier"},
	"226": {"cls":"enemys","id":"yellowKnight"},
	"227": {"cls":"enemys","id":"redKnight"},
	"228": {"cls":"enemys","id":"darkKnight"},
	"229": {"cls":"enemys","id":"blackKing"},
	"230": {"cls":"enemys","id":"yellowKing"},
	"231": {"cls":"enemys","id":"greenKing"},
	"232": {"cls":"enemys","id":"blueKnight"},
	"233": {"cls":"enemys","id":"goldSlime"},
	"234": {"cls":"enemys","id":"poisonSkeleton"},
	"235": {"cls":"enemys","id":"poisonBat"},
	"236": {"cls":"enemys","id":"ironRock"},
	"237": {"cls":"enemys","id":"skeletonPriest"},
	"238": {"cls":"enemys","id":"skeletonKing"},
	"239": {"cls":"enemys","id":"skeletonPresbyter"},
	"240": {"cls":"enemys","id":"skeletonKnight"},
	"241": {"cls":"enemys","id":"evilHero"},
	"242": {"cls":"enemys","id":"devilWarrior"},
	"243": {"cls":"enemys","id":"demonPriest"},
	"244": {"cls":"enemys","id":"goldHornSlime"},
	"245": {"cls":"enemys","id":"redKing"},
	"246": {"cls":"enemys","id":"blueKing"},
	"247": {"cls":"enemys","id":"magicMaster"},
	"248": {"cls":"enemys","id":"silverSlime"},
	"249": {"cls":"enemys","id":"blademaster"},
	"250": {"cls":"enemys","id":"whiteHornSlime"},
	"251": {"cls":"enemys","id":"evilPrincess"},
	"252": {"cls":"enemys","id":"evilFairy"},
	"253": {"cls":"enemys","id":"yellowPriest"},
	"254": {"cls":"enemys","id":"redSwordsman"},
	"255": {"cls":"enemys","id":"whiteSlimeman"},
	"256": {"cls":"enemys","id":"poisonZombie"},
	"257": {"cls":"enemys","id":"dragon"},
	"258": {"cls":"enemys","id":"octopus"},
	"259": {"cls":"enemys","id":"fairyEnemy"},
	"260": {"cls":"enemys","id":"princessEnemy"},
	"261": {"cls":"enemy48","id":"angel"},
	"262": {"cls":"enemy48","id":"elemental"},
	"263": {"cls":"enemy48","id":"steelGuard"},
	"264": {"cls":"enemy48","id":"evilBat"},
	"265": {"cls":"enemys","id":"silverSlimelord"},
	"266": {"cls":"enemys","id":"goldSlimelord"},
	"267": {"cls":"enemys","id":"grayRock"},
	"268": {"cls":"enemys","id":"blueRock"},
	"269": {"cls":"enemys","id":"skeletonLite"},
	"270": {"cls":"enemys","id":"greenKnight"},
	"271": {"cls":"enemys","id":"bowman"},
	"272": {"cls":"enemys","id":"liteBowman"},
	"273": {"cls":"enemys","id":"crimsonZombie"},
	"274": {"cls":"enemys","id":"frozenSkeleton"},
	"275": {"cls":"enemys","id":"watcherSlime"},
	"276": {"cls":"enemys","id":"mutantSlimeman"},
	"277": {"cls":"enemys","id":"frostBat"},
	"278": {"cls":"enemys","id":"devilKnight"},
	"279": {"cls":"enemys","id":"grayPriest"},
	"280": {"cls":"enemys","id":"greenGateKeeper"},
	"300": {"cls":"terrains","id":"ground"},
	"301": {"cls":"terrains","id":"sWallT","name":"薄墙-上","cannotOut":["up"],"cannotIn":["up"]},
	"302": {"cls":"terrains","id":"sWallL","name":"薄墙-左","cannotOut":["left"],"cannotIn":["left"]},
	"303": {"cls":"terrains","id":"sWallR","name":"薄墙-右","cannotOut":["right"],"cannotIn":["right"]},
	"304": {"cls":"terrains","id":"sWallB","name":"薄墙-下","cannotOut":["down"],"cannotIn":["down"]},
	"305": {"cls":"terrains","id":"grass"},
	"306": {"cls":"terrains","id":"sWallTL","name":"薄墙-上左","cannotOut":["up","left"],"cannotIn":["up","left"]},
	"307": {"cls":"terrains","id":"sWallBR","name":"薄墙-下右","cannotOut":["down","right"],"cannotIn":["down","right"]},
	"308": {"cls":"terrains","id":"grass2"},
	"309": {"cls":"terrains","id":"sWallTR","name":"薄墙-上右","cannotOut":["up","right"],"cannotIn":["up","right"]},
	"310": {"cls":"terrains","id":"sWallBL","name":"薄墙-下左","cannotOut":["down","left"],"cannotIn":["down","left"]},
	"311": {"cls":"terrains","id":"ground2"},
	"312": {"cls":"terrains","id":"sWallTB","name":"薄墙-上下","cannotOut":["up","down"],"cannotIn":["up","down"]},
	"313": {"cls":"terrains","id":"ground3"},
	"314": {"cls":"terrains","id":"sWallLR","name":"薄墙-左右","cannotOut":["left","right"],"cannotIn":["left","right"]},
	"315": {"cls":"terrains","id":"sWallBLR","name":"薄墙-下左右","cannotOut":["down","left","right"],"cannotIn":["down","left","right"]},
	"316": {"cls":"terrains","id":"sWallTLR","name":"薄墙-上左右","cannotOut":["up","left","right"],"cannotIn":["up","left","right"]},
	"317": {"cls":"terrains","id":"sWallTBR","name":"薄墙-上下右","cannotOut":["up","down","right"],"cannotIn":["up","down","right"]},
	"318": {"cls":"terrains","id":"sWallTBL","name":"薄墙-上下左","cannotOut":["up","down","left"],"cannotIn":["up","down","left"]},
	"319": {"cls":"items","id":"I319"},
	"320": {"cls":"items","id":"I320"},
	"321": {"cls":"items","id":"I321"},
	"322": {"cls":"items","id":"I322"},
	"323": {"cls":"items","id":"I323"},
	"324": {"cls":"items","id":"I324"},
	"325": {"cls":"items","id":"I325"},
	"326": {"cls":"items","id":"I326"},
	"327": {"cls":"items","id":"I327"},
	"328": {"cls":"items","id":"I328"},
	"329": {"cls":"items","id":"I329"},
	"330": {"cls":"items","id":"I330"},
	"331": {"cls":"terrains","id":"T331"},
	"332": {"cls":"terrains","id":"T332"},
	"333": {"cls":"terrains","id":"T333"},
	"334": {"cls":"terrains","id":"T334"},
	"335": {"cls":"terrains","id":"T335"},
	"336": {"cls":"terrains","id":"T336"},
	"337": {"cls":"terrains","id":"T337"},
	"338": {"cls":"terrains","id":"T338"},
	"339": {"cls":"terrains","id":"T339"},
	"340": {"cls":"terrains","id":"T340"},
	"341": {"cls":"terrains","id":"T341"},
	"342": {"cls":"terrains","id":"T342"},
	"343": {"cls":"terrains","id":"T343"},
	"344": {"cls":"terrains","id":"T344"},
	"345": {"cls":"terrains","id":"T345"},
	"346": {"cls":"terrains","id":"T346"},
	"347": {"cls":"terrains","id":"T347"},
	"348": {"cls":"terrains","id":"T348"},
	"349": {"cls":"terrains","id":"T349"},
	"350": {"cls":"terrains","id":"T350"},
	"351": {"cls":"terrains","id":"T351"},
	"352": {"cls":"terrains","id":"T352"},
	"353": {"cls":"terrains","id":"T353"},
	"354": {"cls":"terrains","id":"T354"},
	"355": {"cls":"terrains","id":"T355"},
	"356": {"cls":"terrains","id":"T356"},
	"357": {"cls":"terrains","id":"T357"},
	"358": {"cls":"terrains","id":"T358"},
	"359": {"cls":"terrains","id":"T359"},
	"360": {"cls":"terrains","id":"T360"},
	"361": {"cls":"terrains","id":"T361"},
	"362": {"cls":"terrains","id":"T362"},
	"363": {"cls":"terrains","id":"T363"},
	"364": {"cls":"terrains","id":"T364"},
	"365": {"cls":"terrains","id":"T365"},
	"366": {"cls":"terrains","id":"T366"},
	"367": {"cls":"npc48","id":"N367"},
	"368": {"cls":"enemys","id":"E368"},
	"369": {"cls":"enemys","id":"E369"},
	"370": {"cls":"enemys","id":"E370"},
	"371": {"cls":"enemys","id":"E371"},
	"372": {"cls":"enemys","id":"E372"},
	"373": {"cls":"enemys","id":"E373"},
	"374": {"cls":"enemys","id":"E374"},
	"375": {"cls":"enemys","id":"E375"},
	"376": {"cls":"items","id":"I376"},
	"377": {"cls":"items","id":"I377"},
	"378": {"cls":"items","id":"I378"},
	"379": {"cls":"items","id":"I379"},
	"380": {"cls":"items","id":"I380"},
	"381": {"cls":"items","id":"I381"},
	"382": {"cls":"items","id":"I382"},
	"383": {"cls":"items","id":"I383"},
	"384": {"cls":"items","id":"I384"},
	"385": {"cls":"items","id":"I385"},
	"386": {"cls":"items","id":"I386"},
	"387": {"cls":"items","id":"I387"},
	"388": {"cls":"items","id":"I388"},
	"389": {"cls":"items","id":"I389"},
	"390": {"cls":"items","id":"I390"},
	"391": {"cls":"items","id":"I391"},
	"392": {"cls":"items","id":"I392"},
	"393": {"cls":"items","id":"I393"},
	"394": {"cls":"items","id":"I394"},
	"395": {"cls":"items","id":"I395"},
	"396": {"cls":"items","id":"I396"},
	"397": {"cls":"items","id":"I397"},
	"398": {"cls":"items","id":"I398"},
	"399": {"cls":"items","id":"I399"},
	"400": {"cls":"items","id":"I400"},
	"401": {"cls":"items","id":"I401"},
	"402": {"cls":"items","id":"I402"},
	"403": {"cls":"items","id":"I403"},
	"404": {"cls":"items","id":"I404"},
	"405": {"cls":"items","id":"I405"},
	"406": {"cls":"items","id":"I406"},
	"407": {"cls":"items","id":"I407"},
	"408": {"cls":"items","id":"I408"},
	"409": {"cls":"items","id":"I409"},
	"410": {"cls":"items","id":"I410"},
	"411": {"cls":"items","id":"I411"},
	"412": {"cls":"items","id":"I412"},
	"413": {"cls":"items","id":"I413"},
	"414": {"cls":"items","id":"I414"},
	"415": {"cls":"items","id":"I415"},
	"416": {"cls":"items","id":"I416"},
	"417": {"cls":"items","id":"I417"},
	"418": {"cls":"items","id":"I418"},
	"419": {"cls":"items","id":"I419"},
	"420": {"cls":"items","id":"I420"},
	"421": {"cls":"items","id":"I421"},
	"422": {"cls":"items","id":"I422"},
	"423": {"cls":"items","id":"I423"},
	"424": {"cls":"items","id":"I424"},
	"425": {"cls":"items","id":"I425"},
	"426": {"cls":"items","id":"I426"},
	"427": {"cls":"items","id":"I427"},
	"428": {"cls":"items","id":"I428"},
	"429": {"cls":"items","id":"I429"},
	"430": {"cls":"items","id":"I430"},
	"431": {"cls":"items","id":"I431"},
	"432": {"cls":"items","id":"I432"},
	"433": {"cls":"items","id":"I433"},
	"434": {"cls":"items","id":"I434"},
	"435": {"cls":"items","id":"I435"},
	"436": {"cls":"items","id":"I436"},
	"437": {"cls":"items","id":"I437"},
	"438": {"cls":"items","id":"I438"},
	"439": {"cls":"items","id":"I439"},
	"440": {"cls":"items","id":"I440"},
	"441": {"cls":"items","id":"I441"},
	"442": {"cls":"items","id":"I442"},
	"443": {"cls":"items","id":"I443"},
	"444": {"cls":"items","id":"I444"},
	"445": {"cls":"items","id":"I445"},
	"446": {"cls":"items","id":"I446"},
	"447": {"cls":"items","id":"I447"},
	"448": {"cls":"items","id":"I448"},
	"449": {"cls":"items","id":"I449"},
	"450": {"cls":"items","id":"I450"},
	"451": {"cls":"items","id":"I451"},
	"452": {"cls":"items","id":"I452"},
	"453": {"cls":"items","id":"I453"},
	"454": {"cls":"items","id":"I454"},
	"455": {"cls":"items","id":"I455"},
	"456": {"cls":"items","id":"I456"},
	"457": {"cls":"items","id":"I457"},
	"458": {"cls":"items","id":"I458"},
	"459": {"cls":"items","id":"I459"},
	"460": {"cls":"items","id":"I460"},
	"461": {"cls":"items","id":"I461"},
	"462": {"cls":"items","id":"I462"},
	"463": {"cls":"items","id":"I463"},
	"464": {"cls":"items","id":"I464"},
	"465": {"cls":"items","id":"I465"},
	"466": {"cls":"items","id":"I466"},
	"467": {"cls":"items","id":"I467"},
	"468": {"cls":"items","id":"I468"},
	"469": {"cls":"items","id":"I469"},
	"470": {"cls":"items","id":"I470"},
	"471": {"cls":"items","id":"I471"},
	"472": {"cls":"items","id":"I472"},
	"473": {"cls":"items","id":"I473"},
	"474": {"cls":"items","id":"I474"},
	"475": {"cls":"items","id":"I475"},
	"476": {"cls":"items","id":"I476"},
	"477": {"cls":"items","id":"I477"},
	"478": {"cls":"items","id":"I478"},
	"479": {"cls":"items","id":"I479"},
	"480": {"cls":"items","id":"I480"},
	"481": {"cls":"items","id":"I481"},
	"482": {"cls":"items","id":"I482"},
	"483": {"cls":"items","id":"I483"},
	"484": {"cls":"items","id":"I484"},
	"485": {"cls":"items","id":"I485"},
	"486": {"cls":"items","id":"I486"},
	"487": {"cls":"items","id":"I487"},
	"488": {"cls":"items","id":"I488"},
	"489": {"cls":"items","id":"I489"},
	"490": {"cls":"items","id":"I490"},
	"491": {"cls":"items","id":"I491"},
	"492": {"cls":"animates","id":"A492","trigger":"openDoor","doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{"yellowKey":1}},"animate":1},
	"493": {"cls":"animates","id":"A493"},
	"494": {"cls":"animates","id":"A494","trigger":"openDoor","animate":1,"doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{"blueKey":1}}},
	"495": {"cls":"animates","id":"A495"},
	"496": {"cls":"animates","id":"A496"},
	"497": {"cls":"animates","id":"A497","trigger":"openDoor","animate":1,"doorInfo":{"time":160,"openSound":"door.mp3","closeSound":"door.mp3","keys":{"redKey":1}}},
	"498": {"cls":"enemys","id":"E498"},
	"499": {"cls":"enemys","id":"E499"},
	"500": {"cls":"enemys","id":"E500"},
	"501": {"cls":"enemys","id":"E501"},
	"502": {"cls":"enemys","id":"E502"},
	"503": {"cls":"enemys","id":"E503"},
	"504": {"cls":"enemys","id":"E504"},
	"505": {"cls":"enemys","id":"E505"},
	"506": {"cls":"animates","id":"A506"},
	"507": {"cls":"animates","id":"A507"},
	"508": {"cls":"animates","id":"A508"},
	"509": {"cls":"animates","id":"A509"},
	"510": {"cls":"animates","id":"A510"},
	"511": {"cls":"enemys","id":"E511"},
	"512": {"cls":"enemys","id":"E512"},
	"513": {"cls":"enemys","id":"E513"},
	"514": {"cls":"enemys","id":"E514"},
	"515": {"cls":"enemys","id":"E515"},
	"516": {"cls":"terrains","id":"T516"},
	"517": {"cls":"enemys","id":"E517"},
	"518": {"cls":"enemys","id":"E518"},
	"519": {"cls":"enemys","id":"E519"},
	"520": {"cls":"enemys","id":"E520"},
	"521": {"cls":"enemys","id":"E521"},
	"522": {"cls":"enemys","id":"E522"},
	"523": {"cls":"enemys","id":"E523"},
	"524": {"cls":"enemys","id":"E524"},
	"525": {"cls":"enemys","id":"E525"},
	"526": {"cls":"terrains","id":"T526","canPass":true},
	"527": {"cls":"terrains","id":"T527"},
	"528": {"cls":"terrains","id":"T528","canBreak":true},
	"529": {"cls":"terrains","id":"T529","layer":null},
	"530": {"cls":"terrains","id":"T530"},
	"531": {"cls":"terrains","id":"T531","canPass":true,"cannotOut":["left","right"],"cannotIn":["left","right"]},
	"532": {"cls":"npcs","id":"N532","faceIds":{"down":"N532","left":"N533","right":"N534","up":"N535"}},
	"533": {"cls":"npcs","id":"N533","faceIds":{"down":"N532","left":"N533","right":"N534","up":"N535"}},
	"534": {"cls":"npcs","id":"N534","faceIds":{"down":"N532","left":"N533","right":"N534","up":"N535"}},
	"535": {"cls":"npcs","id":"N535","faceIds":{"down":"N532","left":"N533","right":"N534","up":"N535"}},
	"536": {"cls":"enemys","id":"E536"},
	"537": {"cls":"enemys","id":"E537"},
	"538": {"cls":"enemys","id":"E538"},
	"539": {"cls":"enemys","id":"E539"},
	"540": {"cls":"animates","id":"A540","canPass":true},
	"541": {"cls":"animates","id":"A541","canPass":true},
	"542": {"cls":"animates","id":"A542","canPass":true},
	"543": {"cls":"animates","id":"A543","canPass":true},
	"544": {"cls":"enemys","id":"E544"},
	"545": {"cls":"enemys","id":"E545"},
	"546": {"cls":"enemys","id":"E546"},
	"547": {"cls":"enemys","id":"E547"},
	"548": {"cls":"enemys","id":"E548"},
	"549": {"cls":"enemys","id":"E549"},
	"550": {"cls":"enemys","id":"E550"},
	"551": {"cls":"terrains","id":"T551"},
	"552": {"cls":"terrains","id":"T552","canPass":true},
	"553": {"cls":"terrains","id":"T553"},
	"554": {"cls":"terrains","id":"T554"},
	"555": {"cls":"terrains","id":"T555"},
	"556": {"cls":"enemys","id":"E556"},
	"557": {"cls":"enemys","id":"E557"},
	"558": {"cls":"items","id":"I558"},
	"559": {"cls":"items","id":"I559"},
	"560": {"cls":"items","id":"I560"},
	"561": {"cls":"enemys","id":"E561"},
	"562": {"cls":"enemys","id":"E562"},
	"563": {"cls":"enemys","id":"E563"},
	"564": {"cls":"enemys","id":"E564"},
	"565": {"cls":"items","id":"I565"},
	"566": {"cls":"enemys","id":"E566"},
	"567": {"cls":"enemys","id":"E567"},
	"568": {"cls":"enemys","id":"E568"},
	"569": {"cls":"enemys","id":"E569"},
	"570": {"cls":"enemys","id":"E570"},
	"571": {"cls":"enemys","id":"E571"},
	"572": {"cls":"enemys","id":"E572"},
	"573": {"cls":"enemys","id":"E573"},
	"574": {"cls":"items","id":"I574"},
	"575": {"cls":"items","id":"I575"},
	"576": {"cls":"enemys","id":"E576"},
	"577": {"cls":"enemys","id":"E577"},
	"578": {"cls":"enemys","id":"E578"},
	"579": {"cls":"enemys","id":"E579"},
	"580": {"cls":"terrains","id":"T580","canPass":true},
	"581": {"cls":"terrains","id":"T581"},
	"582": {"cls":"terrains","id":"T582"},
	"583": {"cls":"terrains","id":"T583"},
	"584": {"cls":"terrains","id":"T584"},
	"585": {"cls":"terrains","id":"T585"},
	"586": {"cls":"terrains","id":"T586"},
	"587": {"cls":"terrains","id":"T587"},
	"588": {"cls":"terrains","id":"T588"},
	"589": {"cls":"items","id":"I589"},
	"590": {"cls":"enemys","id":"E590"},
	"591": {"cls":"enemys","id":"E591"},
	"592": {"cls":"enemys","id":"E592"},
	"593": {"cls":"enemys","id":"E593"},
	"594": {"cls":"enemys","id":"E594"},
	"595": {"cls":"enemys","id":"E595"},
	"596": {"cls":"enemys","id":"E596"},
	"597": {"cls":"enemys","id":"E597"},
	"598": {"cls":"enemys","id":"E598"},
	"599": {"cls":"enemys","id":"E599"},
	"600": {"cls":"enemys","id":"E600"},
	"601": {"cls":"enemys","id":"E601"},
	"602": {"cls":"enemys","id":"E602"},
	"603": {"cls":"enemys","id":"E603"},
	"604": {"cls":"terrains","id":"T604"},
	"605": {"cls":"enemys","id":"E605"},
	"606": {"cls":"enemys","id":"E606"},
	"607": {"cls":"enemys","id":"E607"},
	"608": {"cls":"enemys","id":"E608"},
	"609": {"cls":"enemys","id":"E609"},
	"610": {"cls":"enemys","id":"E610"},
	"611": {"cls":"enemys","id":"E611"},
	"612": {"cls":"enemys","id":"E612"},
	"613": {"cls":"enemys","id":"E613"},
	"614": {"cls":"enemys","id":"E614"},
	"20037": {"cls":"tileset","id":"X20037","cannotOut":["up","left"],"cannotIn":["up","left"]},
	"20038": {"cls":"tileset","id":"X20038","cannotOut":["up"],"cannotIn":["up"]},
	"20039": {"cls":"tileset","id":"X20039","cannotOut":["up","right"],"cannotIn":["up","right"]},
	"20045": {"cls":"tileset","id":"X20045","cannotOut":["left"],"cannotIn":["left"]},
	"20047": {"cls":"tileset","id":"X20047","cannotOut":["right"],"cannotIn":["right"]},
	"20053": {"cls":"tileset","id":"X20053","cannotOut":["down","left"],"cannotIn":["down","left"],"canPass":false},
	"20054": {"cls":"tileset","id":"X20054","cannotOut":["down"],"cannotIn":["down"],"canPass":false},
	"20055": {"cls":"tileset","id":"X20055","cannotOut":["down","right"],"cannotIn":["down","right"]},
	"20056": {"cls":"tileset","id":"X20056","cannotIn":["up","down","left","right"]},
	"20057": {"cls":"tileset","id":"X20057","cannotOut":[],"cannotIn":["up","down","left","right"]},
	"20058": {"cls":"tileset","id":"X20058","cannotIn":["up","down","left","right"]},
	"20064": {"cls":"tileset","id":"X20064","cannotIn":["up","down","left","right"]},
	"20065": {"cls":"tileset","id":"X20065","cannotIn":["up","down","left","right"]},
	"20066": {"cls":"tileset","id":"X20066","cannotIn":["up","down","left","right"]},
	"20074": {"cls":"tileset","id":"X20074","cannotIn":["up","down","left","right"]},
	"20152": {"cls":"tileset","id":"X20152","cannotOut":["left"],"cannotIn":["left"]},
	"20153": {"cls":"tileset","id":"X20153","cannotIn":["right"],"cannotOut":["right"]},
	"30040": {"cls":"tileset","id":"X30040","cannotOut":["up","left"],"cannotIn":["up","left"]},
	"30041": {"cls":"tileset","id":"X30041","cannotOut":["up"],"cannotIn":["up"]},
	"30042": {"cls":"tileset","id":"X30042","cannotOut":["up","right"],"cannotIn":["up","right"]},
	"30048": {"cls":"tileset","id":"X30048","cannotOut":["left"],"cannotIn":["left"]},
	"30050": {"cls":"tileset","id":"X30050","cannotOut":["right"],"cannotIn":["right"]},
	"30056": {"cls":"tileset","id":"X30056","cannotOut":["up","down","left","right"],"cannotIn":["up","down","left","right"]},
	"30057": {"cls":"tileset","id":"X30057","cannotOut":["up","down","left","right"],"cannotIn":["up","down","left","right"]},
	"30058": {"cls":"tileset","id":"X30058","cannotOut":["up","down","left","right"],"cannotIn":["up","down","left","right"]},
	"30105": {"cls":"tileset","id":"X30105","canPass":true},
	"30112": {"cls":"tileset","id":"X30112","canPass":false},
	"30113": {"cls":"tileset","id":"X30113","canPass":true},
	"30121": {"cls":"tileset","id":"X30121","canPass":true},
	"30196": {"cls":"tileset","id":"X30196","canPass":true},
	"30204": {"cls":"tileset","id":"X30204","canPass":true},
	"70048": {"cls":"tileset","id":"X70048","cannotOut":["up","left"],"cannotIn":["up","left"]},
	"70049": {"cls":"tileset","id":"X70049","cannotOut":["up"],"cannotIn":["up"]},
	"70050": {"cls":"tileset","id":"X70050","cannotOut":["up","right"],"cannotIn":["up","right"]},
	"70056": {"cls":"tileset","id":"X70056","cannotOut":["left"],"cannotIn":["left"]},
	"70058": {"cls":"tileset","id":"X70058","cannotOut":["right"],"cannotIn":["right"]},
	"70064": {"cls":"tileset","id":"X70064","cannotOut":["down","left"],"cannotIn":["down","left"]},
	"70065": {"cls":"tileset","id":"X70065","cannotIn":["up","down","left","right"],"cannotOut":["up","down","left","right"]},
	"70066": {"cls":"tileset","id":"X70066","cannotOut":["down","right"],"cannotIn":["down","right"]},
	"70112": {"cls":"tileset","id":"X70112","cannotIn":["down"],"cannotOut":["down"]},
	"70114": {"cls":"tileset","id":"X70114","cannotIn":["down"],"cannotOut":["down"]},
	"70120": {"cls":"tileset","id":"X70120","cannotIn":["up","down","left","right"]},
	"70122": {"cls":"tileset","id":"X70122","cannotIn":["up","down","left","right"]},
	"70128": {"cls":"tileset","id":"X70128","cannotIn":["up","down","left","right"]},
	"70130": {"cls":"tileset","id":"X70130","cannotIn":["up","down","left","right"]},
	"70184": {"cls":"tileset","id":"X70184","canPass":true},
	"70185": {"cls":"tileset","id":"X70185","canPass":true},
	"70186": {"cls":"tileset","id":"X70186","canPass":true},
	"70200": {"cls":"tileset","id":"X70200","canPass":true},
	"70201": {"cls":"tileset","id":"X70201","canPass":true},
	"70202": {"cls":"tileset","id":"X70202","canPass":true}
}