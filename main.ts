import { CreateTaskModal } from "./components/CreateTaskModal";
import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { MainAppModal } from "./signIn";
import "./main.css";
import { createTask, getAuthorizedUser, getTeams } from "./api";

import * as dotenv from "dotenv";
import { SigninRequiredModal } from "components/SigninRequired";

const basePath = (app.vault.adapter as any).basePath;
dotenv.config({
	path: `${basePath}/.obsidian/plugins/click-up-x-obsidian/.env`,
	debug: false,
});

// Remember to rename these classes and interfaces!

type TClickUpRedirectParams = {
	action: string;
	code: string;
};

interface MyPluginSettings {
	user: any;
	teams: any[];
	token: string;
	teamId: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	user: null,
	teamId: "",
	teams: [],
	token: "",
};

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		console.log("loaded?");

		// Returns ClickUp code
		this.registerObsidianProtocolHandler("plugin", async (e) => {
			const parameters = e as TClickUpRedirectParams;
			localStorage.setItem("CLICK_UP_CODE", parameters.code);
		});

		function getVaultPath() {
			const vaultAdapter = app.vault.adapter;
			if (vaultAdapter) {
				return vaultAdapter.getBasePath();
			} else {
				return null;
			}
		}

		// Example usage
		const vaultPath = getVaultPath();
		console.log(`Vault Path: ${vaultPath}`);
		localStorage.setItem("path", vaultPath);

		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new MainAppModal(this, (result) => {
					new Notice(`Hello, ${result}!`);
				}).open();
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		this.addCommand({
			id: "manual-create-task",
			name: "Create ClickUp task",
			callback: async () => {
				if (!this.settings.token) {
					new SigninRequiredModal(this.app).open();
				} else {
					new CreateTaskModal(this).open();
				}
			},
		});

		this.addCommand({
			id: "create-task",
			name: "Create ClickUp task from selection",
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "c" }],
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const sel = editor.getSelection();
				const defaultList = localStorage.getItem("selectedList");

				if (!sel) {
					//alert
					return;
				}
				if (!defaultList) {
					return;
				}
				const list = JSON.parse(defaultList);
				try {
					const task = await createTask({
						data: {
							name: sel,
							description: "",
							assignees: [],
							priority: 3,
						},
						listId: list.id,
					});
					if (task.err) {
						throw new Error(task.err);
					}
					setTimeout(() => {
						editor.replaceRange(
							` [task](${task.url})`,
							editor.getCursor()
						);
					}, 100);
				} catch (e) {
					//alert on error
					console.log(e);
				}
			},
		});
	}

	onunload() {}

	async fetchUser(token: string) {
		const user = await getAuthorizedUser();
		const teams = await getTeams();
		await this.saveData({ user, token, teams });

		await this.loadSettings();
	}

	async clearUser() {
		localStorage.removeItem("token");
		await this.saveData({ token: "", user: null, teams: [] });
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
