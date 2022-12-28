<template>
    <div id="special-main">
        <Scroll id="special-scroll">
            <div id="special">
                <component :is="info"></component>
            </div>
        </Scroll>
        <a-divider
            dashed
            style="margin: 2vh 0 2vh 0; border-color: #ddd4"
        ></a-divider>
        <div id="critical">
            <div style="font-size: 2.5vh; width: 100%; text-align: center">
                临界表
            </div>
            <div id="critical-main">
                <div id="critical-des">
                    <span>加攻</span>
                    <span>减伤</span>
                </div>
                <div v-for="[atk, dam] of criticals" class="critical">
                    <span class="critical-atk">{{ format(atk) }}</span>
                    <span
                        ><span style="font-family: 'Fira Code'">{{
                            dam < 0 ? '=>' : ''
                        }}</span
                        >{{ dam < 0 ? `${format(-dam)}` : format(dam) }}</span
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { isMobile } from '../plugin/use';
import { getSpecialHint } from '../plugin/ui/book';

const enemy = core.plugin.bookDetailEnemy;

const info = getSpecialHint(enemy);

const criticals = core.nextCriticals(enemy, isMobile ? 4 : 8);

const format = core.formatBigNumber;
</script>

<style lang="less" scoped>
#special-main {
    width: 100%;
    user-select: none;
    font-size: 2em;
    position: absolute;
    top: 20vh;
}

#critical-main {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

#critical-des,
.critical {
    font-size: 1.6vw;
    display: flex;
    flex-direction: column;
}

.critical-atk {
    border-bottom: 1px solid #ddd4;
}

.critical {
    border-left: 1px solid #ddd4;
    padding-left: 1%;
}

#special-scroll {
    height: 40vh;
}

@media screen and (max-width: 600px) {
    #detail-main {
        font-size: 1.2em;
    }

    #special-scroll {
        height: 50vh;
    }

    #critical-des,
    .critical {
        font-size: 3.6vw;
    }
}
</style>
