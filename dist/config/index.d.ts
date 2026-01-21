import type { Props, UseLanguageHandler } from '../types';
import { isValidColor, isValidDimensions } from '../utils';
interface Options {
    type: string;
    attribute: Props;
}
declare const CELL_ATTRIBUTE: string[];
declare const CELL_DEFAULT_VALUES: Props;
declare const CELL_DEFAULT_WIDTH = 72;
declare const CELL_PROPERTIES: string[];
declare const COLORS: string[];
declare const DEVIATION = 2;
declare const TABLE_PROPERTIES: string[];
declare function getProperties({ type, attribute }: Options, useLanguage: UseLanguageHandler): {
    title: string;
    properties: ({
        content: string;
        children: ({
            category: string;
            propertyName: string;
            value: string;
            options: string[];
            attribute?: undefined;
            valid?: undefined;
            message?: undefined;
        } | {
            category: string;
            propertyName: string;
            value: string;
            attribute: {
                type: string;
                placeholder: string;
            };
            valid: typeof isValidColor;
            message: string;
            options?: undefined;
        })[];
    } | {
        content: string;
        children: ({
            category: string;
            propertyName: string;
            value: string;
            attribute: {
                type: string;
                placeholder: string;
            };
            valid: typeof isValidDimensions;
            message: string;
            menus?: undefined;
        } | {
            category: string;
            propertyName: string;
            value: string;
            menus: {
                icon: any;
                describe: string;
                align: string;
            }[];
            attribute?: undefined;
            valid?: undefined;
            message?: undefined;
        })[];
    })[];
} | {
    title: string;
    properties: ({
        content: string;
        children: ({
            category: string;
            propertyName: string;
            value: string;
            options: string[];
            attribute?: undefined;
            valid?: undefined;
            message?: undefined;
        } | {
            category: string;
            propertyName: string;
            value: string;
            attribute: {
                type: string;
                placeholder: string;
            };
            valid: typeof isValidColor;
            message: string;
            options?: undefined;
        })[];
    } | {
        content: string;
        children: {
            category: string;
            propertyName: string;
            value: string;
            menus: {
                icon: any;
                describe: string;
                align: string;
            }[];
        }[];
    })[];
};
export { CELL_ATTRIBUTE, CELL_DEFAULT_VALUES, CELL_DEFAULT_WIDTH, CELL_PROPERTIES, COLORS, DEVIATION, TABLE_PROPERTIES, getProperties };
