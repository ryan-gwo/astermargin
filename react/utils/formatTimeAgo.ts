import { formatDistanceToNow } from 'date-fns';
import { zhCN, zhTW } from 'date-fns/locale';
import { interfaceLocale } from './interfaceText';
import { convertUTCToLocal } from './dateUtils';

export function formatTimeAgo(utcDateString: string): string {
    const localDate = convertUTCToLocal(utcDateString);
    const language = interfaceLocale();
    return formatDistanceToNow(localDate, {
        addSuffix: true,
        locale: language === "zh-CN" ? zhCN : language === "zh-TW" ? zhTW : undefined,
    });
}
