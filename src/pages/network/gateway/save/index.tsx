import React, { useEffect, useState, Fragment } from 'react';
import { Modal, Form, Input, Select, Card, Row, Col, Icon } from 'antd';
import { FormComponentProps } from 'antd/es/form';
import { GatewayItem } from '../data.d';
import apis from '@/services';
import encodeQueryParam from '@/utils/encodeParam';
import { randomString } from '@/utils/utils';

interface Props extends FormComponentProps {
  data: Partial<GatewayItem>;
  close: Function;
  save: Function;
}
interface State {
  providerList: any[];
  provider: any;
  supportList: any[];
  support: any;
  networkList: any[];
}

const Save: React.FC<Props> = props => {
  const initState: State = {
    providerList: [],
    provider: props.data?.provider,
    supportList: [],
    support: {},
    networkList: [],
  };

  const {
    form: { getFieldDecorator },
    form,
    data,
  } = props;
  console.log(data, 'rrrrr');
  const [providerList, setProviderList] = useState(initState.providerList);
  const [provider, setProvider] = useState(initState.provider);
  const [networkList, setNetworkList] = useState(initState.networkList);
  const [supportList, setSupportList] = useState(initState.supportList);
  const [routesData, setRoutesData] = useState<{ id: string, url: string, protocol: string }[]>(data.configuration?.routes || [{ id: '1001', url: '', protocol: '' }]);


  useEffect(() => {
    apis.gateway
      .providers()
      .then(response => {
        setProviderList(response.result);
        const tempProvider = props.data?.provider;
        if (tempProvider) {
          const temp = response.result.find((item: any) => tempProvider === item.id);
          // 获取对应的网络组件
          apis.network
            .list(
              encodeQueryParam({
                terms: {
                  type: temp.networkType.value,
                },
              }),
            )
            .then(res => {
              setNetworkList(res.result);
            })
            .catch(() => { });
        }
      })
      .catch(() => { });
    apis.gateway
      .supports()
      .then(response => {
        setSupportList(response.result);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (provider) {
      const temp = providerList.find(item => provider === item.id);
      if (!temp) return;
      apis.network
        .list(
          encodeQueryParam({
            terms: {
              type: temp.networkType.value,
            },
          }),
        )
        .then(response => {
          setNetworkList(response.result);
        })
        .catch(() => { });
    }
  }, [provider]);

  const renderForm = () => {
    let networkType = '';
    if (provider) {
      const temp = providerList.find(item => provider === item.id) || {};
      networkType = (temp.networkType || {}).value;
    }
    switch (networkType) {
      case 'MQTT_CLIENT':
        return (
          <div>
            <Form.Item label="消息协议">
              {getFieldDecorator('configuration.protocol', {
                initialValue: props.data.configuration?.protocol,
              })(
                <Select
                // onChange={(value: string) => {
                // setSupport(value);
                // }}
                >
                  {supportList.map((item: any) => (
                    <Select.Option key={item.id} value={item.id}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>,
              )}
            </Form.Item>

            <Form.Item label="Topics">
              {getFieldDecorator('configuration.topics', {
                initialValue: props.data.configuration?.topics,
              })(<Input.TextArea rows={3} placeholder="从MQTT服务订阅Topic.多个使用,分割" />)}
            </Form.Item>
          </div>
        );
      case 'UDP':
      case 'COAP_SERVER':
      case 'TCP_SERVER':
      case 'HTTP_SERVER':

        return (
          <div>
            <Form.Item label="消息协议">
              {getFieldDecorator('configuration.protocol', {
                initialValue: props.data.configuration?.protocol,
              })(
                <Select>
                  {supportList.map((item: any) => (
                    <Select.Option key={item.id} value={item.id}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>,
              )}
            </Form.Item>
          </div>
        );
      case 'WEB_SOCKET_SERVER':
        return (
          <Fragment>
            <Form.Item label="协议路由">
              <Card>
                {(routesData).map((i, index) => {
                  return (
                    <Row key={i.id} style={{ marginBottom: 5 }}>
                      <Col span={10}>
                        <Input
                          value={i.url}
                          onChange={e => {
                            routesData[index].url = e.target.value;
                            setRoutesData([...routesData]);
                          }}
                          placeholder="key"
                        />
                      </Col>
                      <Col span={2} style={{ textAlign: 'center' }}>
                        <Icon type="right" />
                      </Col>
                      <Col span={10}>
                        <Select
                          value={routesData[index].protocol}
                          onChange={(e: string) => {
                            routesData[index].protocol = e;
                            setRoutesData([...routesData]);
                          }}
                        >
                          {supportList.map((item: any) => (
                            <Select.Option key={item.id} value={item.id}>
                              {item.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Col>

                      <Col span={2} style={{ textAlign: 'center' }}>
                        {index === 0 ? (
                          <Icon
                            type="plus"
                            onClick={() => {
                              routesData.push({
                                id: randomString(8),
                                url: '',
                                protocol: '',
                              });
                              setRoutesData([...routesData]);
                            }}
                          />
                        ) : (
                            <Icon
                              type="minus"
                              onClick={() => {
                                const tempData = routesData.filter(temp => temp.id !== i.id);
                                setRoutesData({ ...tempData });
                              }}
                            />
                          )}
                      </Col>
                    </Row>
                  )
                })}
              </Card>
            </Form.Item>
          </Fragment>
        );
      case 'MQTT_SERVER':
        return null;
      default:
        return null;
    }
  };

  const saveData = () => {
    const tempData = form.getFieldsValue();
    const { id } = props.data;
    if (tempData.provider === 'websocket-server') {
      props.save({ id, ...tempData, configuration: { routes: routesData } });
    } else {
      props.save({ id, ...tempData });
    }
  };

  return (
    <Modal
      width={760}
      title={`${props.data.id ? '编辑' : '新建'}网关`}
      visible
      onCancel={() => props.close()}
      onOk={() => {
        saveData();
      }}
    >
      <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
        <Form.Item label="名称">
          {getFieldDecorator('name', {
            rules: [{ required: true, message: '请输入组件名称' }],
            initialValue: props.data?.name,
          })(<Input />)}
        </Form.Item>
        <Form.Item label="类型">
          {getFieldDecorator('provider', {
            rules: [{ required: true, message: '请选择组件类型' }],
            initialValue: props.data?.provider,
          })(
            <Select
              onChange={(value: string) => {
                setProvider(value);
              }}
            >
              {providerList.map((item: any) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>,
          )}
        </Form.Item>

        <Form.Item label="网络组件">
          {getFieldDecorator('networkId', {
            rules: [{ required: true, message: '请选择组件类型' }],
            initialValue: props.data?.networkId,
          })(
            <Select
              disabled={!provider}
            >
              {networkList.map((item: any) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>,
          )}
        </Form.Item>
        {renderForm()}
        <Form.Item label="描述">
          {getFieldDecorator('describe', {
            initialValue: props.data?.describe,
          })(<Input.TextArea rows={3} />)}
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default Form.create<Props>()(Save);
