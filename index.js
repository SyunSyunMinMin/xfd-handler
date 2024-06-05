// <nowiki>
$(function() {
	if (!mw.config.get('wgPageName').startsWith('Wikipedia:削除依頼/') || mw.config.get('wgPageName').startsWith('Wikipedia:削除依頼/ログ')) {
		return;
	}
	mw.loader.using(['mediawiki.util', 'mediawiki.Title', '@wikimedia/codex'], function(require) {
		const Vue = require('vue');
		const Codex = require('@wikimedia/codex');

		var XFDH = {
			summaryAd: ' ([[User:Syunsyunminmin/script/XfD-handler.js|xfd-handler]])',
			api: new mw.Api(),
			pageName: mw.config.get('wgPageName'),
			hasDelPerm: mw.config.get('wgUserGroups').includes('sysop') || mw.config.get('wgUserGroups').includes('eliminator')
		};
		XFDH.votemenu = [
			{value: '削除'},
			{value: '全削除'},
			{
				label: '一部 削除/存続',
				value: '一部'
			},
			{value: '即時削除'},
			{value: '全即時削除'},
			{value: '存続'},
			{value: '全存続'},
			{value: '即時存続'},
			{value: '全即時存続'},
			{value: '版指定削除'},
			{value: '即時版指定削除'},
			{value: '中立'},
			{value: '緊急削除'},
			{value: '緊急版指定削除'},
			{value: '緊急即時削除'},
			{value: '緊急即時版指定削除'},
			{value: '履歴統合'},
			{value: 'プロジェクトへ移動'},
			{value: '特定版削除'},
			{value: '緊急特定版削除'}
		];
		XFDH.adminTemp = [
			{value: '対処'},
			{value: '確認'},
			{value: '議論終了'},
			{value: '却下'},
			{value: '失効'}
		];
		var list = $('<span>')
			.attr('id', 'xfdh-actionlist')
			.append($('<span>')
				.addClass('mw-editsection-bracket')
				.text('['))
			.append($('<a>')
				.attr({
					class: 'xfdh-actionlink',
					id: 'xfdh-action-vote',
					name: 'vote',
					title: '投票する'
				})
				.append($('<span>')
					.text('投票')));
		if (XFDH.hasDelPerm) {
			list
				.append($('<span>')
					.addClass('mw-editsection-divider')
					.text(' | '))
				.append($('<a>')
					.attr({
						class: 'xfdh-actionlink',
						id: 'xfdh-action-close',
						name: 'close',
						title: '削除依頼を閉じる'
					})
					.append($('<span>')
						.text('閉じる')));
		}
		list.append($('<span>')
			.addClass('mw-editsection-bracket')
			.text(']'));
		$('#mw-content-text .mw-editsection').append(list);

		$('.mw-editsection-divider').show();

		// ダイアログのセットアップ
		createVoteDialog();
		if (XFDH.hasDelPerm) {
			createCloseDialog();
		}

		function createVoteDialog() {
			var votemenu = XFDH.votemenu.concat();
			votemenu.unshift({value: 'コメント'}, {value: '保留'});
			const mountPoint = document.body.appendChild(document.createElement('div'));

			Vue.createMwApp({
				data: function() {
					return {
						showDialog: false,
						defaultAction: {
					 		label: '閉じる'
						},
						primaryAction: {
							label: '実行',
							actionType: 'progressive'
						},
						voteValue: 'コメント',
						votemenuItems: votemenu,
						commentValue: '',
						previewValue: ''
					};
				},
				template: `
				<cdx-dialog v-model:open="showDialog"
					title="投票ダイアログ"
					close-button-label="閉じる"
					:default-action="defaultAction"
					:primary-action="primaryAction"
					@default="showDialog = false"
					@primary="onPrimaryAction"
				>
					<cdx-label
						input-id="xfdh-v-v"
						>
						票またはコメント
						<template #description><a href="https://ja.wikipedia.org/wiki/Template:AFD" target="_blank"><span v-pre>{{AFD}}</span></a>テンプレートに使用されます。既定ではコメントが選択されます。自身の票を選択してください。</template>
					</cdx-label>
					<cdx-select
						v-model:selected="voteValue"
						:menu-items="votemenuItems"
						id="xfdh-v-v"
						@update:selected="changed()"
					></cdx-select>
					<br />
					<cdx-label
						input-id="xfdh-v-c"
						>
						追加コメント
					</cdx-label>
					<cdx-text-area
						v-model="commentValue"
						id="xfdh-v-c"
						@change="changed()"
						autosize
						placeholder="コメントがあれば入力してください。"
					/>
					<cdx-label
						input-id="xfdh-v-p"
						>
						プレビュー
					</cdx-label>
					<cdx-text-area
						id="xfdh-v-p"
						v-model="previewValue"
						autosize
						readonly
					/>
				</cdx-dialog>
			`,
				methods: {
					openDialog() {
						this.showDialog = true;
					},
					onPrimaryAction() {
						this.showDialog = false;
						execute_vote('\n* {{AFD|' + this.voteValue + '}} ' + this.commentValue, this.voteValue);
					},
					changed() {
						this.previewValue = '* {{AFD|' + this.voteValue + '}} ' + this.commentValue;
					}
				},
				mounted() {
					document.getElementById('xfdh-action-vote').addEventListener('click', this.openDialog);
				},
				unMounted() {
					document.getElementById('xfdh-action-vote').removeEventListener(this.openDialog);
				}
			})
				.component('cdx-button', Codex.CdxButton)
				.component('cdx-dialog', Codex.CdxDialog)
				.component('cdx-select', Codex.CdxSelect)
				.component('cdx-label', Codex.CdxLabel)
				.component('cdx-text-area', Codex.CdxTextArea)
				.mount(mountPoint);
		}

		function createCloseDialog() {
			const mountPoint = document.body.appendChild(document.createElement('div'));
			const pages = getXFDTargetPage();
			const targets = [];
			const votemenu = [{value: 'その他'}];
			for (const object of XFDH.votemenu) {
				if (object.value !== '一部') {
					votemenu.push(object);
				}
			}

			for (const page of pages) {
				targets.push({
					label: page,
					value: page
				});
			}

			Vue.createMwApp({
				data: function() {
					return {
						showMainDialog: false,
						showPreviewDialog: false,
						checkboxes: targets,
						defaultAction: {
					 		label: '閉じる'
						},
						primaryAction: {
							label: '実行',
							actionType: 'progressive'
						},
						resultValue: '削除',
						templateValue: '対処',
						closemenuItems: votemenu,
						closeCheckedValues: [],
						closetempItems: XFDH.adminTemp,
						commentValue: '',
						previewValue: '',
						otherResultValue: '',
						previewContent: '',
						delnoteCheckedValue: true,
						rmtagCheckedValue: true,
						closeModeValues: true,
						needCheckValue: false,
						needCheckInput: false
					};
				},
				template: `
				<cdx-dialog v-model:open="showMainDialog"
					title="対処ダイアログ"
					close-button-label="閉じる"
					:default-action="defaultAction"
					:primary-action="primaryAction"
					@default="showMainDialog = false"
					@primary="onPrimaryAction"
				>
					<cdx-label>
						審議対象のページ
						<template #description>削除依頼の審議対象となったページを選択してください。</template>
					</cdx-label>
					<div style="max-height: 200px; overflow-y: auto;">
					<cdx-checkbox
						v-model="closeCheckedValues"
						v-for="checkbox in checkboxes"
						:key="'checkbox-' + checkbox.value"
						:input-value="checkbox.value"
					>
						{{ checkbox.label }}
					</cdx-checkbox>
					</div>
					<cdx-label
						input-id="xfdh-c-v"
						>
						審議結果
						<template #description><span v-pre>{{</span><a href="${mw.util.getUrl('Template:Vfd top')}" target="_blank">Vfd top</a><span v-pre>}}</span>テンプレートおよび<span v-pre>{{</span><a href="${mw.util.getUrl('Template:削除依頼ログ')}" target="_blank">削除依頼ログ</a><span v-pre>}}</span>に使用されます。
						ノートページに追加する審議記録の結果が異なる場合、それぞれ別に実行してください。
						</template>
					</cdx-label>
					<cdx-select
						v-model:selected="resultValue"
						:menu-items="closemenuItems"
						id="xfdh-c-v"
					></cdx-select>
					<cdx-text-input v-model="otherResultValue" aria-label="審議結果の詳細" v-if="resultValue == 'その他'" placeholder="Aを削除、Bは存続"></cdx-text-input>
					<br />
					<cdx-label>
						モード
					</cdx-label>
					<cdx-checkbox
						v-model="closeModeValues"
					>
						削除依頼を閉じる
					</cdx-checkbox>
					<cdx-field
						v-if="closeModeValues"
					>
					<cdx-label
						input-id="xfdh-c-t"
						>
						対処テンプレート
					</cdx-label>
					<cdx-select
						v-model:selected="templateValue"
						:menu-items="closetempItems"
						id="xfdh-c-t"
						@update:selected="changed()"
					></cdx-select>
					<cdx-label
						input-id="xfdh-c-c"
						>
						追加コメント
					</cdx-label>
					<cdx-text-area
						v-model="commentValue"
						id="xfdh-c-c"
						@change="changed()"
						autosize
						placeholder="コメントがあれば入力してください。"
					/>
					<cdx-label
						input-id="xfdh-c-p"
						>
						コメントプレビュー
					</cdx-label>
					<cdx-text-area
						id="xfdh-c-p"
						v-model="previewValue"
						autosize
						readonly
					/>
					<br />
					<cdx-checkbox
						v-model="needCheckValue"
						:disabled="needCheckInput"
					>
						<span v-pre>{{</span><a href="${mw.util.getUrl('Template:確認待ち')}" target="_blank">確認待ち</a><span v-pre>}}</span>を追加する
					</cdx-checkbox>
					<cdx-button
						@click="openPreviewDialog"
					>
						全体プレビュー
					</cdx-button>
					</cdx-field>
					<br />
					<cdx-checkbox
						v-model="delnoteCheckedValue"
					>
						ノートページに<span v-pre>{{</span><a href="${mw.util.getUrl('Template:削除依頼ログ')}" target="_blank">削除依頼ログ</a><span v-pre>}}</span>を追加する
					</cdx-checkbox>
					<cdx-checkbox
						v-model="rmtagCheckedValue"
					>
						ページから削除依頼タグを除去する
					</cdx-checkbox>
				</cdx-dialog>

				<cdx-dialog v-model:open="showPreviewDialog"
					title="プレビュー"
					close-button-label="Close"
					:default-action="defaultAction"
					@default="closePreviewDialog"
				>
				<div
					v-html="previewContent"
				>
				</div>
				</cdx-dialog>
			`,
				methods: {
					openDialog() {
						this.showMainDialog = true;
					},
					async openPreviewDialog() {
						this.showMainDialog = false;
						const comment = generateAdminComment(this.templateValue, this.commentValue);
						const content = await generateNewContent(getResult(this), comment, {needCheck: this.needCheckValue});
						this.previewContent = await createPreviewContent(content);
						this.showPreviewDialog = true;
					},
					closePreviewDialog() {
						this.showMainDialog = true;
						this.showPreviewDialog = false;
					},
					async onPrimaryAction() {
						this.showMainDialog = false;
						await execute_close(this);
					},
					async changed() {
						this.previewValue = generateAdminComment(this.templateValue, this.commentValue);
						if (this.templateValue !== '対処') {
							this.needCheckInput = true;
						} else {
							this.needCheckInput = false;
						}
					}
				},
				watch: {

				},
				mounted() {
					document.getElementById('xfdh-action-close').addEventListener('click', this.openDialog);
				},
				unMounted() {
					document.getElementById('xfdh-action-close').removeEventListener(this.openDialog);
				}
			})
				.component('cdx-button', Codex.CdxButton)
				.component('cdx-dialog', Codex.CdxDialog)
				.component('cdx-checkbox', Codex.CdxCheckbox)
				.component('cdx-select', Codex.CdxSelect)
				.component('cdx-label', Codex.CdxLabel)
				.component('cdx-text-area', Codex.CdxTextArea)
				.component('cdx-text-input', Codex.CdxTextInput)
				.component('cdx-field', Codex.CdxField)
				.mount(mountPoint);
		}

		function getResult(obj) {
			var result;
			if (obj.resultValue === 'その他') {
				result = obj.otherResultValue;
			} else {
				result = obj.resultValue;
			}
			return result;
		}

		function getXFDTargetPage() {
			// 履歴ページへのリンクから削除対象かもしれないページを取得
			const titles = [];

			$('#mw-content-text a').each(function() {
				const url = $(this).attr('href');

				const action = mw.util.getParamValue('action', url);
				if (action === 'history') {
					const title = mw.util.getParamValue('title', url);
					titles.push(title);
				}
			});
			return titles;
		}

		async function createPreviewContent(content, title = XFDH.pageName) {
			const newContent = await XFDH.api.parse(content, {
				disablelimitreport: 1,
				format: 'json',
				preview: 1,
				pst: 1,
				text: content,
				title: title
			});
			return newContent;
		}

		async function generateNewContent(result, comment, {title = XFDH.pageName, needCheck = false} = {}) {
			const headerRegExp = /(^===.*===$)/m,
				emCatRegExp = /<noinclude\s*>\s*\[\[\s*(?:category|カテゴリ)\s*:\s*緊急案件\s*\|\s*(?:\{\{[^}]*\}\}|[^}\]])*\s*\]\]<\/noinclude>\n?/i,
				checktagRegExp = /\{\{\s*確認待ち\s*(\|[^}]*)?\}\}\n?/;
			const response = await XFDH.api.get({
				action: 'query',
				format: 'json',
				formatversion: '2',
				prop: 'revisions',
				rvprop: 'content',
				rvslots: '*',
				titles: title
			});
			const oldContent = response.query.pages[0].revisions[0].slots.main.content;
			var newContent = oldContent;
			if (needCheck) {
				newContent = oldContent.replace(headerRegExp, '$1\n{{確認待ち}}').replace(emCatRegExp, '');
				newContent += '\n' + comment;
			} else {
				var toptag = '{{subst:Vfd top|' + result + '}}';
				newContent = oldContent
					.replace(headerRegExp, '$1\n' + toptag)
					.replace(emCatRegExp, '')
					.replace(checktagRegExp, '');
				newContent += '\n' + comment + '\n' + '{{subst:Vfd bottom}}';
			}
			return newContent;
		}

		function generateAdminComment(temp, comment) {
			var result = '**';
			if (temp === '確認') {
				result += '*';
			}
			result += ' {{AFD|' + temp + '}} ' + comment + '--~~~~';
			return result;
		}

		async function editPage(title, content, summary) {
			const result = await XFDH.api.postWithToken('csrf', {
				action: 'edit',
				format: 'json',
				title: title,
				text: content,
				summary: summary + XFDH.summaryAd,
				nocreate: 1,
				formatversion: '2'
			});
			if ('error' in result) {
				mw.notify($(`<span><a href="${mw.util.getUrl(title)}" target="_blank">${title}</a> の編集中にエラーが発生しました。<br />エラー内容: ${result.error.info}</span>`), {
					autoHide: false,
					title: '[エラー] ' + result.error.code,
					type: 'error'
				});
				return 'error';
			}
			mw.notify($(`<span><a href="${mw.util.getUrl(title)}" target="_blank">${title}</a> の編集に成功しました。</span>`), {
				title: title
			});
			return 'success';
		}

		function execute_vote(text, vote) {
			var summary = '';
			if (vote === 'コメント') {
				summary = 'コメント';
			} else {
				summary = '投票: ' + vote;
			}
			XFDH.api.postWithToken(
				'csrf',
				{
					action: 'edit',
					appendtext: text,
					summary: summary + XFDH.summaryAd,
					nocreate: true,
					title: XFDH.pageName,
					format: 'json'
				}
			).then(function() {
				mw.notify('投票に成功しました。');
			}, function(data, detail) {
				mw.notify($('<div>' + data + '<br />' + detail.error.info + '</div>'), {
					autoHide: false,
					title: 'エラー',
					type: 'error'
				});
			});
		}

		async function execute_close(obj) {
			// エラー処理
			if (obj.closeCheckedValues.length === 0 && (obj.delnoteCheckedValue || obj.rmtagCheckedValue)) {
				mw.notify('削除依頼対象のページが1つも指定されていません', {type: 'error'});
				return;
			}
			for (let i = 0; i < obj.closeCheckedValues.length; i++) {
				const title = obj.closeCheckedValues[i];
				if (obj.rmtagCheckedValue) {
					await rmtagFromPage(title);
				}
				if (obj.delnoteCheckedValue) {
					await addDelNote(title, getResult(obj));
				}
			}
			const newContent = await generateNewContent(getResult(obj), generateAdminComment(obj.templateValue, obj.commentValue), {needCheck: obj.needCheckValue});
			var summary = '';
			if (obj.templateValue === '対処') {
				summary = '対処';
				if (obj.needCheckValue) {
					summary += '、確認待ち';
				} else {
					summary += '終了';
				}
			} else if (obj.templateValue === '確認') {
				summary = '確認';
			} else {
				summary = '終了';
			}
			const apiResult = await editPage(XFDH.pageName, newContent, summary);
			return apiResult;
		}

		async function rmtagFromPage(title) {
			const response = await XFDH.api.get({
				action: 'query',
				format: 'json',
				formatversion: '2',
				prop: 'revisions',
				rvprop: 'content',
				rvslots: '*',
				titles: title
			});
			const oldcontent = response.query.pages[0].revisions[0].slots.main.content;
			const topCmt = '<!-- 削除についての議論が終了するまで、下記のメッセージ部分は除去しないでください。もしあなたがこのテンプレートを除去した場合、差し戻されます。またページが保護されることもあります。 -->',
				lstCmt = '<!-- 削除についての議論が終了するまで、上記部分は削除しないでください。 -->',
				hasTopCmt = oldcontent.includes(topCmt),
				hasLstCmt = oldcontent.includes(lstCmt),
				tagRegExp = /\{\{\s*[sS]akujo\/本体\s*\|\s*\d{4}年\d{1,2}月\d{1,2}日\s*\|\s*(<nowiki>.*(?!<\/nowiki>).*<\/nowiki>|[^}])*\}\}\n?/,
				hasTag = tagRegExp.test(oldcontent);
			var newContent = oldcontent
				.replace(topCmt, '')
				.replace(lstCmt, '')
				.replace(tagRegExp, '')
				.trim();
			if (!hasTag) {
				mw.notify($(`<span><a href="${mw.util.getUrl(title)}" target="_blank">${title}</a> で削除依頼タグが検出できませんでした。</span><br /><span>既に除去されたか、そもそも削除審議の対象ではないかもしれません。</span>`), {
					autoHide: false,
					title: '[エラー] ' + title,
					type: 'error'
				});
				return;
			}
			if (!hasTopCmt || !hasLstCmt) {
				var warnText = $(`<span><a href="${mw.util.getUrl(title)}" target="_blank">${title}</a> の削除依頼タグの上下にあるコメントのどちらか、または両方が検出できませんでした。</span><br /><span>コメントが除去できていない可能性があります。手動で確認してください。</span>`),
					warnTitle = '[警告] ' + title;
				mw.notify(warnText, {
					autoHide: false,
					title: warnTitle,
					type: 'warn'
				});
			}
			const apiResult = await editPage(title, newContent, '-sakujo');
			return apiResult;
		}

		async function addDelNote(title, result) {
			const titleobj = new mw.Title(title);
			const talkpage = titleobj.getTalkPage().getPrefixedText();
			const isTalk = titleobj.isTalkPage();
			const response = await XFDH.api.get({
				action: 'query',
				format: 'json',
				formatversion: '2',
				prop: 'revisions',
				rvprop: 'content',
				rvslots: '*',
				titles: talkpage
			});
			const missing = Object.prototype.hasOwnProperty.call(response.query.pages[0], 'missing');
			var xfdDate = await XFDH.api.get({
				action: 'query',
				format: 'json',
				prop: 'revisions',
				titles: XFDH.pageName,
				formatversion: '2',
				rvprop: 'timestamp',
				rvslots: '*',
				rvlimit: '1',
				rvdir: 'newer'
			});
			xfdDate = xfdDate.query.pages[0].revisions[0].timestamp;
			xfdDate = new Date(xfdDate);
			xfdDate = `${xfdDate.getFullYear()}年${xfdDate.getMonth() + 1}月${xfdDate.getDate()}日`;
			var newTemp = '',
				newContent;
			if (!missing) {
				const oldcontent = response.query.pages[0].revisions[0].slots.main.content;
				const curtemplate = oldcontent.match(/(\{\{削除依頼ログ(?:<nowiki>.*<\/nowiki>|[^}}])*\}\})/gs);
				if (curtemplate !== null) {
					curtemplate.forEach(function(temp) {
						const regexp = /talk=true/;
						const isfortalk = regexp.test(temp);
						const counter = temp.match(/\|(?:full)?page(?<num>\d+)/g);
						var count = 1;
						counter.forEach(function(t) {
							var num = t.match(/\d+/);
							num = Number(num[0]);
							if (count <= num) {
								count = num + 1;
							}
						});

						if (!isfortalk && !isTalk || isfortalk && isTalk) {
							newTemp = temp.slice(0, -2) + '{{subst:Dpn|page=' + XFDH.pageName.slice(15) + '|2=' + result + '|date=' + xfdDate + '|n=' + count + '}}\n}}';
							newContent = oldcontent.replace(temp, newTemp);
						}
					});
				} else {
					newTemp = '{{subst:Dpn|page=' + XFDH.pageName.slice(15) + '|2=' + result + '|date=' + xfdDate + '}}\n';
					newContent = newTemp + oldcontent;
				}
			} else {
				newContent = newTemp = '{{subst:Dpn|page=' + XFDH.pageName.slice(15) + '|2=' + result + '|date=' + xfdDate + '}}\n\n';
			}
			const apiResult = await editPage(talkpage, newContent, '+{{削除依頼ログ}}');
			return apiResult;
		}
	});
});
// </nowiki>
