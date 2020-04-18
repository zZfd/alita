export default (absTmpPath: string) => `
import React from 'react';
import { routes } from '${absTmpPath}/core/routes';
import { setLayoutInstance } from './KeepAliveModel';
import { match, pathToRegexp } from '@alitajs/keep-alive/node_modules/path-to-regexp';
const isKeepPath = (aliveList:any[],path:string)=>{
  let isKeep = false;
  aliveList.map(item=>{
    if(item === path){
      isKeep = true;
    }
    if(item instanceof RegExp && item.test(path)){
      isKeep = true;
    }
    if(typeof item === 'string' && item.toLowerCase() === path){
      isKeep = true;
    }
  })
  return isKeep;
}
const getKeepAliveViewMap = (routeList:any[],aliveList:any[])=>{
  let keepAliveMap = {};
  function find(routess: any[], list:any[]) {
    if(!routess|| !list ){
      return routess;
    }
    return routess.map(element => {
      if (!Array.isArray(element.routes)&&isKeepPath(list,element.path.toLowerCase())) {
        element.recreateTimes = 0;
        keepAliveMap[element.path.toLowerCase()] = element;
      }else{
        element.routes = find(element.routes,aliveList);
      }
      return element;
    });
  }
  find(routeList,aliveList)
  return keepAliveMap;
}
const getView = (
  pathname: string,
  keepAliveViewMap: { [key: string]: any },
) => {
  let View;
  for (const key in keepAliveViewMap) {
    if (pathToRegexp(key).test(pathname)) {
      View = keepAliveViewMap[key]
      break;
    }
  }
  return View;
};
const getMatch = (path,pathname) => {
  const {params}:any=match(path, { decode: decodeURIComponent })(pathname)
  return {match:{params,url:pathname,path}}
};
interface PageProps {
  location: {
    pathname: string;
  };
}
export default class BasicLayout extends React.PureComponent<PageProps> {
  constructor(props: any) {
    super(props);
    this.keepAliveViewMap = getKeepAliveViewMap(routes,props.keepalive);
  }
  componentDidMount() {
    setLayoutInstance(this);
  }

  keepAliveViewMap = {};

  alivePathnames: string[] = [];

  render() {
    const {
      location: { pathname },
    } = this.props;
    const showKeepAlive = !!getView(pathname, this.keepAliveViewMap);
    if (showKeepAlive) {
      const index = this.alivePathnames.findIndex(
        tPathname => tPathname === pathname.toLowerCase(),
      );
      if (index === -1) {
        this.alivePathnames.push(pathname.toLowerCase());
      }
    }
    return (
      <>
        <div
          style={{ position: 'relative' }}
          hidden={!showKeepAlive}
          className="rumtime-keep-alive-layout"
        >
          {this.alivePathnames.map(curPathname => {
            const { component:View, recreateTimes, path } = getView(
              curPathname,
              this.keepAliveViewMap,
            );
            const pageProps = {...this.props,...getMatch(path,curPathname)};
            return View ? (
              <div
                id={\`BasicLayout-\${curPathname}\`}
                key={
                  curPathname + recreateTimes
                }
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                }}
                hidden={curPathname !== pathname.toLowerCase()}
              >
                <View {...pageProps} />
              </div>
            ) : null;
          })}
        </div>
        <div hidden={showKeepAlive} className="rumtime-keep-alive-layout-no">
          {!showKeepAlive && this.props.children}
        </div>
      </>
    )
  }
}
`;
