import { useSelector } from 'react-redux';

import CustomVariable from './CustomVariable';
import BaseView, {
  BaseViewProps,
  BaseViewHeadingProps,
  BaseViewHeading,
  BaseViewBody,
  BaseViewIcons,
  BaseViewIconButton,
} from '@/components/views/BaseView';

import { ReactComponent as SaveIcon } from '@/assets/icons/save.svg';
import { ReactComponent as RefreshIcon } from '@/assets/icons/refresh.svg';

import { RootState, useAppDispatch } from '@/store/reducers';
import {
  ConfigVar,
  ConfigVarState,
  CustomVarState,
} from '@/store/types/config';

function validAndModified(state: ConfigVarState): ConfigVar | null {
  if (state.__type === 'custom') {
    const value = state.__value;
    if (value === null) {
      return null;
    } else {
      const filteredValue = Object.keys(value).reduce((acc, key) => {
        const child = validAndModified(value[key]);
        if (child === null) {
          return acc;
        }

        return {
          ...acc,
          [key]: child,
        };
      }, {});

      if (Object.keys(filteredValue).length === 0) {
        return null;
      }

      return {
        __type: 'custom',
        __value: filteredValue,
        __hasChanged: state.__hasChanged
      };
    }
  } else {
    // TODO: keep in sync with the corresponding check in BasicVariable
    if (!state.__valid || state.__value === state.__newValue) {
      return null;
    }

    if (state.__type === 'enum') {
      return {
        __type: state.__type,
        __value: state.__newValue,
        __enumClass: state.__enumClass,
        __enumValues: state.__enumValues,
        __hasChanged: state.__hasChanged
      };
    } else {
      return {
        __type: state.__type,
        __value: state.__newValue,
        __hasChanged: state.__hasChanged
      };
    }
  }
}

type ConfigViewProps = BaseViewProps & BaseViewHeadingProps;

const ConfigView = ({
  id,
  isDraggable = false,
  isUnlocked = false,
}: ConfigViewProps) => {
  const dispatch = useAppDispatch();

  const configRoot = useSelector(
    (state: RootState) => state.config.configRoot,
  ) as CustomVarState;

  const rootValue = configRoot.__value;
  if (rootValue === null) {
    return null;
  }

  const sortedKeys = Object.keys(rootValue);
  sortedKeys.sort();

  return (
    <BaseView isUnlocked={isUnlocked}>
      <div className="flex">
        <BaseViewHeading isDraggable={isDraggable}>
          Configuration
        </BaseViewHeading>
        <BaseViewIcons>
          <BaseViewIconButton
            title="Save Changes"
            onClick={() => {
              const configDiff = validAndModified(configRoot);
              if (configDiff != null) {
                dispatch({
                  type: 'SAVE_CONFIG',
                  configDiff,
                });
              }
            }}
          >
            <SaveIcon className="h-6 w-6" />
          </BaseViewIconButton>
          <BaseViewIconButton
            title="Reload Values"
            onClick={() =>
              dispatch({
                type: 'REFRESH_CONFIG',
              })
            }
          >
            <RefreshIcon className="h-6 w-6" />
          </BaseViewIconButton>
        </BaseViewIcons>
      </div>
      <BaseViewBody>
        <table className="block h-full">
          <tbody className="block">
            {sortedKeys.map((key) => (
              <CustomVariable
                key={key}
                name={key}
                path={id ? `${id}.${key}` : key}
                // invariant 2: children of the root are custom
                state={rootValue[key] as CustomVarState}
                onChange={(newState) =>
                  dispatch({
                    type: 'UPDATE_CONFIG',
                    configRoot: {
                      __type: 'custom',
                      __value: sortedKeys.reduce(
                        (acc, key2) => ({
                          ...acc,
                          [key2]: key === key2 ? newState : rootValue[key2],
                        }),
                        {},
                      ),
                      __hasChanged: newState.__hasChanged
                    },
                  })
                }
                onSave={(variable) =>
                  dispatch({
                    type: 'SAVE_CONFIG',
                    configDiff: {
                      __type: 'custom',
                      __value: {
                        [key]: variable,
                      },
                      __hasChanged: variable.__hasChanged
                    },
                  })
                }
              />
            ))}
          </tbody>
        </table>
      </BaseViewBody>
    </BaseView>
  );
};

export default ConfigView;
