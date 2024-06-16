import { SettingOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  ConfigProvider,
  Flex,
  Input,
  Modal,
  Space,
  Spin,
  Typography,
} from "antd";
import * as React from "react";
import { createRoot } from "react-dom/client";

function SettingsModal({ closeModal }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [settings, setSettings] = React.useState({
    apiKey: "",
    basePrompt:
      "You are a Gen Z who knows all the latest trends. You are chatting with a friend who is a boomer and doesn't know what gen z slang means. How would you explain it to them? You also have access to the internet to look up information.Only include the description of the slang term. Do not include the slang term itself.",
  });

  React.useEffect(() => {
    setIsLoading(true);
    window.api
      .getSettings()
      .then((settings) => {
        setSettings((prev) => ({ ...prev, ...(settings || {}) }));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function saveSettings() {
    setIsLoading(true);
    await window.api.saveSettings(settings);
    setIsLoading(false);
    closeModal();
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: 300 }}>
        <Spin />
      </Flex>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Input
        placeholder="API
        Key"
        value={settings.apiKey}
        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
      />
      <Input.TextArea
        rows={7}
        placeholder="Base Prompt"
        value={settings.basePrompt}
        onChange={(e) =>
          setSettings({ ...settings, basePrompt: e.target.value })
        }
      />
      <Button
        block
        disabled={!settings.apiKey || !settings.basePrompt}
        onClick={saveSettings}
        type="primary"
      >
        Save
      </Button>
    </Space>
  );
}

export default function App() {
  const [isSettingsModalVisible, setIsSettingsModalVisible] =
    React.useState(false);
  const [selectedText, setSelectedText] = React.useState("");
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [llmResult, setLlmResult] = React.useState({
    resultForText: "",
    result: "",
  });

  const getLatestSelectedTextResponse = React.useCallback(async (text) => {
    const latestText = text || selectedText;
    if (!latestText) return;
    setIsLoaded(true);
    const response = await window.api.getLLMResponse(latestText);
    setLlmResult({
      resultForText: latestText,
      result: response,
    });
    setIsLoaded(false);
  }, []);

  React.useEffect(() => {
    window.api.onTextSelected(async (text) => {
      setSelectedText(text);
      if (text) {
        getLatestSelectedTextResponse();
      }
    });
  }, [getLatestSelectedTextResponse]);

  const [currentSettings, setCurrentSettings] = React.useState(null);

  React.useEffect(() => {
    window.api.getSettings().then((settings) => {
      setCurrentSettings(settings);
    });
  }, [isSettingsModalVisible]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#00b96b",
          borderRadius: 8,
        },
      }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Flex justify="flex-end">
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => setIsSettingsModalVisible(true)}
          />
        </Flex>
        {(!currentSettings || !currentSettings.apiKey) && (
          <Alert
            message="API Key not set"
            description="Please set your OpenAI API key in the settings. It is stored securely on your machine and never sent to any server, except OpenAI's."
            type="warning"
            showIcon
          />
        )}
        <Input.Search
          size="large"
          placeholder="Enter text to search..."
          value={selectedText}
          onChange={(e) => setSelectedText(e.target.value)}
          onSearch={getLatestSelectedTextResponse}
          enterButton
        />
        <Card loading={isLoaded}>
          {llmResult.resultForText ? (
            <Flex vertical gap={8}>
              <Typography.Text type="secondary">
                Showing results for: <b>{llmResult.resultForText}</b>
              </Typography.Text>
              <Typography.Text>{llmResult.result}</Typography.Text>
            </Flex>
          ) : (
            <Typography.Text type="secondary">
              No results to show. Please enter text to search.
            </Typography.Text>
          )}
        </Card>
        <Modal
          title="Settings"
          visible={isSettingsModalVisible}
          onCancel={() => setIsSettingsModalVisible(false)}
          footer={null}
        >
          <SettingsModal closeModal={() => setIsSettingsModalVisible(false)} />
        </Modal>
      </Space>
    </ConfigProvider>
  );
}

const rootNode = document.getElementById("app");
const appRoot = createRoot(rootNode);
appRoot.render(<App />);
