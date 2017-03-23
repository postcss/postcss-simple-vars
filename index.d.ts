/**
 * postcss-simple-vars
 * PostCSS plugin for Sass-like variables
 * @author    {ashelley <andrey@sitnik.ru>}
 * @copyright {MIT@2016-now}
 */
declare module "postcss-simple-vars" {
  /**
   * Simple vars namespace
   */
  namespace simpleVars {
    /**
     * variables Argument
     * @interface IArgument
     */
    type IArgument = {
      [index: string]: any;
    }

    /**
     * Callable argument
     * @type {function}
     * @interface ICallableArgument
     */
    type ICallableArgument = () => IArgument;

    /**
     * Vars argument
     * @export
     * @interface ISimpleVarsArgument
     */
    export interface ISimpleVarsArgument {
      variables: IArgument;
    }

    /**
     * Callable variables argument  
     * @export
     * @interface ISimpleVarsCallableArgument
     */
    export interface ISimpleVarsCallableArgument {
      variables: ICallableArgument;
    }
  }

  /**
   * Exported function
   * @param {simpleVars.ISimpleVarsArgument} arg 
   * @returns {*} 
   */
  function simpleVars(arg: simpleVars.ISimpleVarsArgument): any;

  /**
   * Exported function
   * @param {simpleVars.ISimpleVarsArgument} arg 
   * @returns {*} 
   */
  function simpleVars(arg: simpleVars.ISimpleVarsCallableArgument): any;

  /**
   * Default export
   */
  export = simpleVars;
}

