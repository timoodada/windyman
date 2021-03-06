import React, {
  createRef,
  FC,
  forwardRef,
  ForwardRefRenderFunction,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import ReactDOM from 'react-dom';
import { CSSTransition } from 'react-transition-group';
import {
  DataItem,
  MultiDataChildren,
  MultiDataManager,
  MultiDataSet,
  PickerValues,
  SelectorInterface,
  SelectorOpenOptions
} from '../picker/core';
import { Icon } from '../icon';
import { ScrollY, useScrollY } from '../scroll-y';
import { combineClassNames } from '../../common/utils';
import './style.scss';

interface SelectorColumnProps {
  onClick: (item: DataItem, key: number, index: number) => void;
  activeKey?: number;
  item: MultiDataChildren;
  index: number;
}
const SelectorColumn: FC<SelectorColumnProps> = function(props) {
  const { onClick, activeKey, item, index: key } = props;
  const scroll = useScrollY();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeKeyRef = useRef(activeKey);
  useEffect(() => {
    if (scroll.scrollToElement && wrapperRef.current && typeof activeKeyRef.current !== 'undefined') {
      scroll.scrollToElement(
        wrapperRef.current.getElementsByClassName('windy-selector-option')[activeKeyRef.current] as HTMLElement,
        300,
        0,
        true
      );
    }
  }, [scroll]);
  return (
    <ScrollY scroll={scroll}>
      <div ref={wrapperRef}>
        {
          item.map((val, k) => (
            <div
              className={
                combineClassNames('windy-selector-option',
                  activeKey === k ? 'active' : null,
                  val.disabled ? 'disabled' : null
                )
              }
              key={k}
              onClick={e => onClick(val, key, k)}
            >
              {val.name}
              {
                activeKey === k ?
                  <Icon type={'check'} className={'icon'} /> :
                  null
              }
            </div>
          ))
        }
      </div>
    </ScrollY>
  );
};

interface SelectorProps {
  data: MultiDataSet;
  defaultSelectedIndex?: number[];
  onChange?: (values: (string | number)[]) => void;
  title?: ReactNode;
}
const Selector: FC<SelectorProps> = function(props) {
  const { data, defaultSelectedIndex = [], onChange, title } = props;

  const [ selectedIndex, setSelectedIndex ] = useState<number[]>(defaultSelectedIndex);
  const [ currentColumn, setCurrentColumn ] = useState<number>(selectedIndex.length);
  const [ activeName, setActiveName ] = useState<number>(selectedIndex.length);
  const valuesRef = useRef<(string | number)[]>(selectedIndex.map((val, key) => data[key][val].value));

  const left = useMemo(() => {
    return -Math.floor(currentColumn / 2) * 50;
  }, [currentColumn]);
  const width = useMemo(() => {
    return data.length / 2 * 100;
  }, [data]);
  const itemWidth = useMemo(() => {
    return 1 / data.length * 100;
  }, [data]);
  const selectedItems = useMemo(() => {
    return selectedIndex.map((val, key) => {
      return data[key][val];
    });
  }, [selectedIndex, data]);
  const selectedNameMaxWidth = useMemo(() => {
    return 1 / Math.min(selectedItems.length + 1, data.length) * 100 + '%';
  }, [data, selectedItems]);

  const onSelectedNameClick = useCallback((column: number) => {
    setCurrentColumn(Math.min(column, valuesRef.current.length));
    setActiveName(column);
  }, []);
  const onClick = useCallback((item: DataItem, key: number, index: number) => {
    if (item.disabled) { return; }
    valuesRef.current[key] = item.value;
    valuesRef.current.splice(key + 1);
    setSelectedIndex(val => {
      const copy = val.slice(0);
      copy[key] = index;
      copy.splice(key + 1);
      return copy;
    });
    onSelectedNameClick(valuesRef.current.length);
    if (typeof onChange === 'function') {
      onChange(valuesRef.current);
    }
  }, [onChange, onSelectedNameClick]);

  return (
    <div className={'windy-selector-wrapper'}>
      <div className={'extra-info'}>
        {
          title ?
            <div className={'windy-selector-title'}>{title}</div> :
            null
        }
        <div className={'select-names'}>
          {
            selectedItems.map((item, key) => (
              <span
                className={combineClassNames('select-name', key === activeName - 1 ? 'active' : null)}
                key={key}
                onClick={e => onSelectedNameClick(key + 1)}
                style={{maxWidth: selectedNameMaxWidth}}
              >
                {item.name}
              </span>
            ))
          }
          {
            selectedItems.length < data.length ?
              <span
                className={combineClassNames('select-name', activeName === selectedIndex.length + 1 ? 'active' : null)}
                onClick={e => onSelectedNameClick(selectedIndex.length + 1)}
                style={{maxWidth: selectedNameMaxWidth}}
              >请选择</span> :
              null
          }
        </div>
      </div>
      <div className={'windy-selector-container'}>
        <div className={'windy-selector'} style={{width: width + '%', left: left + '%'}}>
          {
            data.map((item, key) => (
              <div className={'windy-selector-item'} key={key} style={{width: itemWidth + '%'}}>
                {
                  key > 0 && typeof selectedIndex[key - 1] === 'undefined' ?
                    null :
                    <SelectorColumn onClick={onClick} index={key} activeKey={selectedIndex[key]} item={item} />
                }
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export { Selector };

interface SelectorModalProps {
  afterClose?: () => void;
  dataManager: MultiDataManager;
  onSubmit?: (values?: (string | number)[]) => void;
  title?: ReactNode;
  wrapperClassName?: string;
}
interface SelectorModalInstance {
  show(): void;
  hide(): void;
  dataManager: MultiDataManager;
  setData: (data?: MultiDataSet | MultiDataChildren) => void;
  setValue: (values?: PickerValues) => void;
}
export const useSelectors = (): SelectorModalInstance => {
  const instance = useRef<SelectorModalInstance>({} as SelectorModalInstance);
  return instance.current;
};
const SelectorModalFc: ForwardRefRenderFunction<SelectorModalInstance, SelectorModalProps> = function(props, ref) {
  const { afterClose, dataManager, onSubmit, title, wrapperClassName } = props;

  const defaultSelectedRef = useRef(dataManager.values.length ? dataManager.realSelectedIndex : []);

  const [ show, setShow ] = useState(false);
  const [ data, setDatas ] = useState<MultiDataSet>(dataManager.dataSet);

  const setData = useCallback((d?: MultiDataSet | MultiDataChildren) => {
    dataManager.setData(d);
    setDatas(dataManager.dataSet);
  }, [dataManager]);
  const setValue = useCallback((values?: PickerValues) => {
    dataManager.setValues(values);
    setDatas(dataManager.dataSet);
  }, [dataManager]);

  const instance = useMemo<SelectorModalInstance>(() => {
    return {
      show() {
        setShow(true);
      },
      hide() {
        setShow(false);
      },
      dataManager,
      setData,
      setValue
    };
  }, [dataManager, setValue, setData]);
  const onExited = useCallback(() => {
    if (typeof afterClose === 'function') {
      afterClose();
    }
  }, [afterClose]);
  const onChange = useCallback((values: (string | number)[]) => {
    setValue(values);
    if (values.length === data.length) {
      instance.hide();
      if (typeof onSubmit === 'function') {
        onSubmit(dataManager.values);
      }
    }
  }, [setValue, data, instance, onSubmit, dataManager]);
  const stopDefault = useCallback((e: any) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useImperativeHandle(ref, () => {
    return instance;
  });

  return (
    <CSSTransition
      in={show}
      classNames={{
        enter: 'windy-selector-enter',
        enterActive: 'windy-selector-enter-active',
        exit: 'windy-selector-exit',
        exitActive: 'windy-selector-exit-active',
        exitDone: 'windy-selector-exit-done'
      }}
      timeout={300}
      onExited={onExited}
    >
      <div className={combineClassNames('windy-selector-modal-mask', wrapperClassName)} onClick={instance.hide}>
        <div className={'windy-selector-modal'} onClick={stopDefault}>
          <Selector data={data} defaultSelectedIndex={defaultSelectedRef.current} onChange={onChange} title={title} />
        </div>
      </div>
    </CSSTransition>
  );
};

const SelectorModal = forwardRef<SelectorModalInstance, SelectorModalProps>(SelectorModalFc);

export class SelectorService implements SelectorInterface {
  ele: Element | null = null;
  dataManager: MultiDataManager;
  ref: RefObject<SelectorModalInstance> = createRef<SelectorModalInstance>();
  constructor(multi: number) {
    this.dataManager = new MultiDataManager(multi);
  }

  setData(data: MultiDataChildren | MultiDataSet) {
    if (this.ref.current) {
      this.ref.current.setData(data);
    } else {
      this.dataManager.setData(data);
    }
  }
  setValue(value?: PickerValues) {
    if (this.ref.current) {
      this.ref.current.setValue(value);
    } else {
      this.dataManager.setValues(value);
    }
  }
  open(options: SelectorOpenOptions): Promise<any> {
    const { data, title, defaultValue, wrapperClassName } = options;
    this.destroy();
    return new Promise((resolve, reject) => {
      const container = document.createElement('div');
      container.className = 'windy-selector-container';
      document.body.appendChild(container);
      this.dataManager.setData(data);
      this.dataManager.setValues(defaultValue);
      ReactDOM.render(
        <SelectorModal
          ref={this.ref}
          afterClose={() => this.destroy()}
          dataManager={this.dataManager}
          onSubmit={e => resolve(e)}
          title={title}
          wrapperClassName={wrapperClassName}
        />,
        container,
        () => {
          this.ref.current?.show();
        }
      );
      this.ele = container;
    });
  }
  destroy() {
    this.ref = createRef();
    if (this.ele) {
      ReactDOM.unmountComponentAtNode(this.ele);
      this.ele.remove();
    }
  }
}
