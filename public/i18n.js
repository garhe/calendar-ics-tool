const languageStorageKey = 'calendar-ics-language';
const supportedLanguages = ['en', 'zh-CN', 'vi'];
const languageLabels = { en: 'EN', 'zh-CN': '简体', vi: 'VI' };

const translations = {
  'zh-CN': {
    'Your calendar, composed': '轻松创建你的日历',
    'Calendar ICS Tool': 'ICS 日历工具',
    'Switch language': '切换语言',
    'Language': '语言',
    'Color': '颜色',
    'Custom color': '自定义颜色',
    'Custom': '自定义',
    'Interface style': '界面风格',
    'Background artwork': '背景图案',
    'Flow': '流线',
    'Contours': '等高线',
    'Branches': '枝脉',
    'Waves': '波浪',
    'Floral': '花卉',
    'Leaves': '叶片',
    'Clouds': '云朵',
    'Mountains': '山峦',
    'Trees': '树木',
    'Birds': '飞鸟',
    'Aqualife': '水生生物',
    'New variation': '生成新图案',
    'Glass': '玻璃',
    'Watercolor': '水彩',
    'Sketch': '素描',
    'Theme': '主题',
    'Color & shade': '颜色与深浅',
    'Sage': '鼠尾草绿', 'Lagoon': '潟湖蓝', 'Sky': '天空蓝', 'Iris': '鸢尾紫', 'Rose': '玫瑰红',
    'Mist': '雾色', 'Soft': '柔和', 'Deep': '深色',
    'Event workspace': '日程工作区',
    'Choose an event type': '选择日程类型',
    'Create': '创建',
    'From text or screenshot': '从文本或截图创建',
    'Lunar event': '农历日程',
    'Recurring event': '重复日程',
    'Creation steps': '创建步骤',
    '1. Details': '1. 详情',
    '2. Review & export': '2. 检查并导出',
    'Screenshot clipboard': '粘贴截图',
    'Paste zone': '截图粘贴区',
    'Read screenshot': '识别截图',
    'Remove screenshot': '移除截图',
    'Event text': '日程文本',
    'Extract & review': '提取并检查',
    'Event title': '日程标题',
    'Gregorian date (optional)': '公历日期（可选）',
    'Lunar date': '农历日期',
    'Timezone': '时区',
    'Generate & review 60 reminders': '生成并检查 60 个提醒',
    'Describe the recurring event': '描述重复日程',
    'Fill schedule': '填写计划',
    'Title': '标题',
    'Location': '地点',
    'First date': '首次日期',
    'All-day event': '全天日程',
    'Start time': '开始时间',
    'End time': '结束时间',
    'Ends the next day': '次日结束',
    'Repeat': '重复周期',
    'Daily': '每天', 'Weekly': '每周', 'Monthly': '每月', 'Quarterly': '每季度', 'Yearly': '每年',
    'Every': '每',
    'Schedule details': '计划详情',
    'Week starts on': '每周开始于',
    'Monday': '星期一', 'Tuesday': '星期二', 'Wednesday': '星期三', 'Thursday': '星期四',
    'Friday': '星期五', 'Saturday': '星期六', 'Sunday': '星期日',
    'Days of the week': '星期',
    'Mon': '一', 'Tue': '二', 'Wed': '三', 'Thu': '四', 'Fri': '五', 'Sat': '六', 'Sun': '日',
    'Months': '月份', 'On': '模式', 'Dates of the month': '每月日期', 'Weekday position': '星期位置',
    'Dates': '日期', 'Position': '位置', 'First': '第一个', 'Second': '第二个', 'Third': '第三个',
    'Fourth': '第四个', 'Fifth': '第五个', 'Last': '最后一个', 'Day': '星期',
    'Ends': '结束', 'Never': '永不', 'On date': '指定日期', 'After occurrences': '重复次数后',
    'Last date (inclusive)': '最后日期（含）', 'Occurrences': '次数', 'Reminder': '提醒', 'None': '无',
    'At start': '开始时', '5 minutes before': '提前 5 分钟', '15 minutes before': '提前 15 分钟',
    '30 minutes before': '提前 30 分钟', '1 hour before': '提前 1 小时', '1 day before': '提前 1 天',
    '1 week before': '提前 1 周', 'Description & skipped dates': '说明与跳过日期', 'Description': '说明',
    'Skip date': '跳过日期', 'Review recurring event': '检查重复日程', 'Cancel edit': '取消编辑',
    'Review & export': '检查并导出', 'Add event': '添加日程', 'Export options': '导出选项',
    'File mode': '文件模式', 'One .ics file with all events': '将所有日程保存到一个 .ics 文件',
    'One .ics file per event': '每个日程保存为一个 .ics 文件', 'Choose folder': '选择文件夹',
    'Destination: Downloads': '目标：下载文件夹', 'Export .ics': '导出 .ics',
    'City or IANA timezone': '城市或 IANA 时区', 'City or UTC offset': '城市或 UTC 时差',
    'UTC+7 or city name': 'UTC+7 或城市名称', "Tom's birthday every year on Jun 5": '小明的生日，每年 6 月 5 日',
    'Show events ({count})': '显示日程（{count}）', 'Hide events ({count})': '隐藏日程（{count}）',
    'No events yet. Extract from text or add one manually.': '暂无日程。请从文本提取或手动添加。',
    'Event {number}': '日程 {number}', 'Remove': '移除', 'Edit recurrence': '编辑重复规则',
    'Date': '日期', 'Start': '开始', 'End': '结束', 'Timezone (required)': '时区（必填）',
    'day(s)': '天', 'week(s)': '周', 'month(s)': '个月', 'quarter(s)': '个季度', 'year(s)': '年',
    'Save & review': '保存并检查', 'Remove skipped date {date}': '移除跳过的日期 {date}',
    '{date} / Remove': '{date} / 移除', 'Edit canceled.': '已取消编辑。',
    'Recurring event updated.': '重复日程已更新。', 'Recurring event added.': '重复日程已添加。',
    'Screenshot ready.': '截图已就绪。', 'Screenshot removed.': '截图已移除。',
    'Unable to read this screenshot. Try another image.': '无法读取此截图，请尝试其他图片。',
    'Paste or type event text first.': '请先粘贴或输入日程文本。',
    'Extracted {count} event(s). Review and edit before export.': '已提取 {count} 个日程。请检查并编辑后再导出。',
    'Paste a screenshot first.': '请先粘贴截图。', 'Running OCR...': '正在识别文字…',
    'OCR done. Review text and click "Extract Events".': '识别完成。请检查文本并点击“提取并检查”。',
    'OCR failed. Try a clearer screenshot or paste text manually.': '识别失败。请使用更清晰的截图或手动粘贴文本。',
    'Folder selection is unavailable here. Export will use your browser Downloads folder.': '此处无法选择文件夹，将导出到浏览器的下载文件夹。',
    'Selected: {name}': '已选择：{name}', 'Output folder selected. Choose file mode and export.': '已选择输出文件夹。请选择文件模式并导出。',
    'Folder selection canceled. Export will use your browser Downloads folder.': '已取消选择文件夹，将导出到浏览器的下载文件夹。',
    'Need at least one complete event with a title and date.': '至少需要一个包含标题和日期的完整日程。',
    'Failed to write file(s). Check folder permissions and try again.': '文件写入失败。请检查文件夹权限后重试。',
    'Every timed event requires a valid city/IANA timezone or UTC offset.': '每个定时日程都需要有效的城市、IANA 时区或 UTC 时差。',
    'Enter an event title and lunar date as DD-MM-YYYY.': '请输入日程标题和 DD-MM-YYYY 格式的农历日期。',
    'The lunar calendar library did not load. Check your internet connection and reload.': '农历库加载失败。请检查网络连接并重新加载。',
    'Enter a valid lunar event date as DD-MM-YYYY.': '请输入有效的 DD-MM-YYYY 格式农历日期。',
    'Added 60 lunar event reminders with one-day alerts. Review them before export.': '已添加 60 个提前一天提醒的农历日程。请检查后再导出。',
    '{action} 1 file with {count} event(s).': '已{action} 1 个文件，其中包含 {count} 个日程。',
    '{action} {count} file(s), one per event.': '已{action} {count} 个文件，每个日程一个文件。',
    'Saved': '保存', 'Downloaded': '下载'
  },
  vi: {
    'Your calendar, composed': 'Lịch của bạn, thật gọn gàng',
    'Calendar ICS Tool': 'Công cụ lịch ICS',
    'Switch language': 'Chuyển ngôn ngữ',
    'Language': 'Ngôn ngữ',
    'Color': 'Màu sắc',
    'Custom color': 'Màu tùy chỉnh',
    'Custom': 'Tùy chỉnh',
    'Interface style': 'Phong cách giao diện',
    'Background artwork': 'Họa tiết nền',
    'Flow': 'Dòng chảy',
    'Contours': 'Đường đồng mức',
    'Branches': 'Nhánh',
    'Waves': 'Sóng',
    'Floral': 'Hoa',
    'Leaves': 'Lá',
    'Clouds': 'Mây',
    'Mountains': 'Núi',
    'Trees': 'Cây',
    'Birds': 'Chim',
    'Aqualife': 'Sinh vật dưới nước',
    'New variation': 'Tạo biến thể mới',
    'Glass': 'Kính',
    'Watercolor': 'Màu nước',
    'Sketch': 'Phác thảo',
    'Theme': 'Giao diện',
    'Color & shade': 'Màu và sắc độ',
    'Sage': 'Xanh xô thơm', 'Lagoon': 'Xanh đầm phá', 'Sky': 'Xanh da trời', 'Iris': 'Tím diên vĩ', 'Rose': 'Hồng',
    'Mist': 'Sương', 'Soft': 'Nhẹ', 'Deep': 'Đậm',
    'Event workspace': 'Không gian sự kiện',
    'Choose an event type': 'Chọn loại sự kiện',
    'Create': 'Tạo',
    'From text or screenshot': 'Từ văn bản hoặc ảnh chụp',
    'Lunar event': 'Sự kiện âm lịch',
    'Recurring event': 'Sự kiện lặp lại',
    'Creation steps': 'Các bước tạo',
    '1. Details': '1. Chi tiết',
    '2. Review & export': '2. Xem lại và xuất',
    'Screenshot clipboard': 'Dán ảnh chụp màn hình',
    'Paste zone': 'Vùng dán ảnh',
    'Read screenshot': 'Đọc ảnh chụp',
    'Remove screenshot': 'Xóa ảnh chụp',
    'Event text': 'Nội dung sự kiện',
    'Extract & review': 'Trích xuất và xem lại',
    'Event title': 'Tên sự kiện',
    'Gregorian date (optional)': 'Ngày dương lịch (tùy chọn)',
    'Lunar date': 'Ngày âm lịch',
    'Timezone': 'Múi giờ',
    'Generate & review 60 reminders': 'Tạo và xem lại 60 lời nhắc',
    'Describe the recurring event': 'Mô tả sự kiện lặp lại',
    'Fill schedule': 'Điền lịch',
    'Title': 'Tiêu đề',
    'Location': 'Địa điểm',
    'First date': 'Ngày đầu tiên',
    'All-day event': 'Sự kiện cả ngày',
    'Start time': 'Giờ bắt đầu',
    'End time': 'Giờ kết thúc',
    'Ends the next day': 'Kết thúc vào ngày hôm sau',
    'Repeat': 'Lặp lại',
    'Daily': 'Hàng ngày', 'Weekly': 'Hàng tuần', 'Monthly': 'Hàng tháng', 'Quarterly': 'Hàng quý', 'Yearly': 'Hàng năm',
    'Every': 'Mỗi',
    'Schedule details': 'Chi tiết lịch',
    'Week starts on': 'Tuần bắt đầu vào',
    'Monday': 'Thứ Hai', 'Tuesday': 'Thứ Ba', 'Wednesday': 'Thứ Tư', 'Thursday': 'Thứ Năm',
    'Friday': 'Thứ Sáu', 'Saturday': 'Thứ Bảy', 'Sunday': 'Chủ Nhật',
    'Days of the week': 'Các ngày trong tuần',
    'Mon': 'T2', 'Tue': 'T3', 'Wed': 'T4', 'Thu': 'T5', 'Fri': 'T6', 'Sat': 'T7', 'Sun': 'CN',
    'Months': 'Tháng', 'On': 'Vào', 'Dates of the month': 'Ngày trong tháng', 'Weekday position': 'Thứ tự ngày trong tuần',
    'Dates': 'Ngày', 'Position': 'Vị trí', 'First': 'Đầu tiên', 'Second': 'Thứ hai', 'Third': 'Thứ ba',
    'Fourth': 'Thứ tư', 'Fifth': 'Thứ năm', 'Last': 'Cuối cùng', 'Day': 'Ngày',
    'Ends': 'Kết thúc', 'Never': 'Không bao giờ', 'On date': 'Vào ngày', 'After occurrences': 'Sau số lần lặp',
    'Last date (inclusive)': 'Ngày cuối (bao gồm)', 'Occurrences': 'Số lần', 'Reminder': 'Nhắc nhở', 'None': 'Không',
    'At start': 'Khi bắt đầu', '5 minutes before': 'Trước 5 phút', '15 minutes before': 'Trước 15 phút',
    '30 minutes before': 'Trước 30 phút', '1 hour before': 'Trước 1 giờ', '1 day before': 'Trước 1 ngày',
    '1 week before': 'Trước 1 tuần', 'Description & skipped dates': 'Mô tả và ngày bỏ qua', 'Description': 'Mô tả',
    'Skip date': 'Bỏ qua ngày', 'Review recurring event': 'Xem lại sự kiện lặp', 'Cancel edit': 'Hủy chỉnh sửa',
    'Review & export': 'Xem lại và xuất', 'Add event': 'Thêm sự kiện', 'Export options': 'Tùy chọn xuất',
    'File mode': 'Chế độ tệp', 'One .ics file with all events': 'Một tệp .ics chứa tất cả sự kiện',
    'One .ics file per event': 'Một tệp .ics cho mỗi sự kiện', 'Choose folder': 'Chọn thư mục',
    'Destination: Downloads': 'Đích: Thư mục Tải xuống', 'Export .ics': 'Xuất .ics',
    'City or IANA timezone': 'Thành phố hoặc múi giờ IANA', 'City or UTC offset': 'Thành phố hoặc độ lệch UTC',
    'UTC+7 or city name': 'UTC+7 hoặc tên thành phố', "Tom's birthday every year on Jun 5": 'Sinh nhật của Tom vào ngày 5 tháng 6 hàng năm',
    'Show events ({count})': 'Hiện sự kiện ({count})', 'Hide events ({count})': 'Ẩn sự kiện ({count})',
    'No events yet. Extract from text or add one manually.': 'Chưa có sự kiện. Hãy trích xuất từ văn bản hoặc thêm thủ công.',
    'Event {number}': 'Sự kiện {number}', 'Remove': 'Xóa', 'Edit recurrence': 'Sửa lịch lặp',
    'Date': 'Ngày', 'Start': 'Bắt đầu', 'End': 'Kết thúc', 'Timezone (required)': 'Múi giờ (bắt buộc)',
    'day(s)': 'ngày', 'week(s)': 'tuần', 'month(s)': 'tháng', 'quarter(s)': 'quý', 'year(s)': 'năm',
    'Save & review': 'Lưu và xem lại', 'Remove skipped date {date}': 'Xóa ngày bỏ qua {date}',
    '{date} / Remove': '{date} / Xóa', 'Edit canceled.': 'Đã hủy chỉnh sửa.',
    'Recurring event updated.': 'Đã cập nhật sự kiện lặp.', 'Recurring event added.': 'Đã thêm sự kiện lặp.',
    'Screenshot ready.': 'Ảnh chụp đã sẵn sàng.', 'Screenshot removed.': 'Đã xóa ảnh chụp.',
    'Unable to read this screenshot. Try another image.': 'Không thể đọc ảnh này. Hãy thử ảnh khác.',
    'Paste or type event text first.': 'Hãy dán hoặc nhập nội dung sự kiện trước.',
    'Extracted {count} event(s). Review and edit before export.': 'Đã trích xuất {count} sự kiện. Hãy xem lại và chỉnh sửa trước khi xuất.',
    'Paste a screenshot first.': 'Hãy dán ảnh chụp trước.', 'Running OCR...': 'Đang nhận dạng văn bản…',
    'OCR done. Review text and click "Extract Events".': 'Đã nhận dạng xong. Hãy xem lại văn bản và bấm “Trích xuất và xem lại”.',
    'OCR failed. Try a clearer screenshot or paste text manually.': 'Nhận dạng thất bại. Hãy thử ảnh rõ hơn hoặc dán văn bản thủ công.',
    'Folder selection is unavailable here. Export will use your browser Downloads folder.': 'Không thể chọn thư mục tại đây. Tệp sẽ được tải xuống thư mục Tải xuống của trình duyệt.',
    'Selected: {name}': 'Đã chọn: {name}', 'Output folder selected. Choose file mode and export.': 'Đã chọn thư mục đầu ra. Hãy chọn chế độ tệp và xuất.',
    'Folder selection canceled. Export will use your browser Downloads folder.': 'Đã hủy chọn thư mục. Tệp sẽ được tải xuống thư mục Tải xuống của trình duyệt.',
    'Need at least one complete event with a title and date.': 'Cần ít nhất một sự kiện hoàn chỉnh có tiêu đề và ngày.',
    'Failed to write file(s). Check folder permissions and try again.': 'Không thể ghi tệp. Hãy kiểm tra quyền thư mục và thử lại.',
    'Every timed event requires a valid city/IANA timezone or UTC offset.': 'Mỗi sự kiện có giờ cần một thành phố, múi giờ IANA hoặc độ lệch UTC hợp lệ.',
    'Enter an event title and lunar date as DD-MM-YYYY.': 'Nhập tên sự kiện và ngày âm lịch theo định dạng DD-MM-YYYY.',
    'The lunar calendar library did not load. Check your internet connection and reload.': 'Không tải được thư viện âm lịch. Hãy kiểm tra kết nối và tải lại trang.',
    'Enter a valid lunar event date as DD-MM-YYYY.': 'Nhập ngày âm lịch hợp lệ theo định dạng DD-MM-YYYY.',
    'Added 60 lunar event reminders with one-day alerts. Review them before export.': 'Đã thêm 60 lời nhắc âm lịch báo trước một ngày. Hãy xem lại trước khi xuất.',
    '{action} 1 file with {count} event(s).': 'Đã {action} 1 tệp chứa {count} sự kiện.',
    '{action} {count} file(s), one per event.': 'Đã {action} {count} tệp, mỗi sự kiện một tệp.',
    'Saved': 'lưu', 'Downloaded': 'tải xuống'
  }
};

let activeLanguage = (() => {
  try {
    const saved = localStorage.getItem(languageStorageKey);
    if (supportedLanguages.includes(saved)) return saved;
  } catch {}
  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith('zh')) return 'zh-CN';
  if (browserLanguage.startsWith('vi')) return 'vi';
  return 'en';
})();

function t(source, variables = {}) {
  let result = translations[activeLanguage]?.[source] || source;
  for (const [name, value] of Object.entries(variables)) result = result.replaceAll(`{${name}}`, value);
  return result;
}

function translatePage(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.parentElement?.closest('script, style')) continue;
    const currentText = node.textContent.trim();
    if (!currentText) continue;
    const source = node.parentElement?.dataset.i18nSource || currentText;
    node.parentElement.dataset.i18nSource ||= source;
    const translated = t(source);
    node.textContent = node.textContent.replace(currentText, translated);
  }
  root.querySelectorAll?.('[placeholder], [aria-label], [title], optgroup[label]').forEach((element) => {
    for (const attribute of ['placeholder', 'aria-label', 'title', 'label']) {
      if (!element.hasAttribute(attribute)) continue;
      const sourceKey = `i18n${attribute.replace(/(^|-)(\w)/g, (_, __, letter) => letter.toUpperCase())}Source`;
      element.dataset[sourceKey] ||= element.getAttribute(attribute);
      element.setAttribute(attribute, t(element.dataset[sourceKey]));
    }
  });
  document.documentElement.lang = activeLanguage;
  document.title = t('Calendar ICS Tool');
  const picker = document.getElementById('languagePicker');
  if (picker) {
    const summary = picker.querySelector('summary');
    summary.querySelector('.language-code').textContent = languageLabels[activeLanguage];
    summary.setAttribute('aria-label', t('Switch language'));
    summary.title = t('Switch language');
    picker.querySelectorAll('input[name="language"]').forEach((input) => {
      input.checked = input.value === activeLanguage;
    });
  }
}

function setLanguage(language) {
  activeLanguage = supportedLanguages.includes(language) ? language : 'en';
  try { localStorage.setItem(languageStorageKey, activeLanguage); } catch {}
  translatePage();
  document.dispatchEvent(new CustomEvent('languagechange', { detail: { language: activeLanguage } }));
}

window.calendarI18n = { t, translatePage, setLanguage, get language() { return activeLanguage; } };

document.addEventListener('DOMContentLoaded', () => {
  translatePage();
  const languagePicker = document.getElementById('languagePicker');
  languagePicker.addEventListener('change', (event) => {
    if (!event.target.matches('input[name="language"]')) return;
    setLanguage(event.target.value);
    languagePicker.open = false;
    languagePicker.querySelector('summary').focus();
  });
});