import './styles/main.less';

import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, IndexRoute, Redirect, Link, browserHistory} from 'react-router';
import moment from 'moment';
import {difference, intersection, isEqual, pick, omit, find, memoize, sortBy} from 'lodash';
import cx from 'classnames';

const parseTime = memoize((time) => Number(moment(time, 'ddd MMM DD HH:mm:ss z YYYY')));

class App extends React.Component {
  state = {}

  constructor() {
    super();
    this.fetchData();
  }

  async fetchData() {
    const response = await fetch('/data');
    const data = await response.json();
    this.setState({data});
  }

  render() {
    const {data} = this.state;
    if (!data) {
      return (
        <div className='progress' style={{marginTop: '50px'}}>
          <div className='progress-bar progress-bar-striped active' style={{width: '100%'}} />
        </div>
      );
    } else {
      return (
        <div>
          <Link to='/'><h1>{'m31'}</h1></Link>
          {React.cloneElement(
            React.Children.only(this.props.children),
            {data}
          )}
        </div>
      );
    }
  }
}

class DashboardPage extends React.Component {
  static defaultProps = {
    columns: ['id', 'managerId', 'location', 'department', 'gradeType', 'position', 'category']
  }

  render() {
    const {data, columns} = this.props;
    const sortedDataCollectionTimes = sortBy(Object.keys(data), parseTime);
    const dataCollectionTimesByPairs = sortedDataCollectionTimes.reduce((result, value, index) => {
      if (index + 1 < sortedDataCollectionTimes.length) {
        result.unshift([sortedDataCollectionTimes[index], sortedDataCollectionTimes[index + 1]]);
      }
      return result;
    }, []);
    return (
      <table className='table'>
        {dataCollectionTimesByPairs.map(([timeStart, timeEnd]) => {
          return <DiffList
            key={timeStart}
            columns={columns}
            timeStart={timeStart}
            timeEnd={timeEnd}
            dataStart={data[timeStart]}
            dataEnd={data[timeEnd]}
          />;
        })}
      </table>
    );
  }
}

class DiffList extends React.Component {
  renderColumn = (column, data, source) => {
    let result = data[column];
    if (result !== null && column.match(/id$/i)) {
      result = <Link
        to={'/tree/' + this.props['time' + source] + '/' + result}
        children={this.props['data' + source][result].fullName}
      />;
    }
    return result;
  }

  render() {
    const {columns, timeStart, timeEnd, dataStart, dataEnd} = this.props;
    const dataStartKeys = Object.keys(dataStart);
    const dataEndKeys = Object.keys(dataEnd);
    const removedKeys = difference(dataStartKeys, dataEndKeys);
    const addedKeys = difference(dataEndKeys, dataStartKeys);
    const changedKeys = intersection(dataStartKeys, dataEndKeys).filter((key) => {
      return !isEqual(pick(dataStart[key], columns), pick(dataEnd[key], columns));
    });
    return (
      <tbody>
        <tr key='header'>
          <td colSpan={columns.length}>
            <h3>
              <Link to={'/tree/' + timeStart}>{timeStart}</Link>
              {' → '}
              <Link to={'/tree/' + timeEnd}>{timeEnd}</Link>
            </h3>
          </td>
        </tr>
        {removedKeys.map((key) => {
          return <DiffEntry
            key={key}
            mode='remove'
            columns={columns}
            renderColumn={this.renderColumn}
            dataStart={dataStart[key]}
          />;
        })}
        {addedKeys.map((key) => {
          return <DiffEntry
            key={key}
            mode='add'
            columns={columns}
            renderColumn={this.renderColumn}
            dataEnd={dataEnd[key]}
          />;
        })}
        {changedKeys.map((key) => {
          return <DiffEntry
            key={key}
            mode='diff'
            columns={columns}
            renderColumn={this.renderColumn}
            dataStart={dataStart[key]}
            dataEnd={dataEnd[key]}
          />;
        })}
      </tbody>
    );
  }
}

const SOURCE_START = 'Start';
const SOURCE_END = 'End';

class DiffEntry extends React.Component {
  static defaultProps = {mode: 'diff'}

  render() {
    const {columns, renderColumn, mode, dataStart, dataEnd} = this.props;
    const className = {remove: 'danger', add: 'success'}[mode] || null;
    return (
      <tr className={className}>
        {columns.map((column) => {
          return <td key={column}>{
            mode === 'add' ?
              renderColumn(column, dataEnd, SOURCE_END)
            : mode === 'remove' || dataStart[column] === dataEnd[column] ?
              renderColumn(column, dataStart, SOURCE_START)
            :
              [
                <div key='removed' className='diff-removed'>
                  {renderColumn(column, dataStart, SOURCE_START)}
                </div>,
                <div key='added' className='diff-added'>
                  {renderColumn(column, dataEnd, SOURCE_END)}
                </div>
              ]
          }</td>;
        })}
      </tr>
    );
  }
}

class TreeViewPage extends React.Component {
  render() {
    const {data, params} = this.props;
    const {time, highlight} = params;
    const treeData = data[time];
    const rootId = find(treeData, 'isRootManager').id;
    const highlightedId = highlight in treeData ? highlight : null;
    return (
      <div>
        <h3>{params.time}</h3>
        <Tree rootId={rootId} highlightedId={highlightedId} data={treeData} />
      </div>
    );
  }
}

class Tree extends React.Component {
  state = {
    expandedNodes: {
      [this.props.rootId]: true
    }
  }

  toggleNode = (nodeId) => {
    const nodeVisible = this.state.expandedNodes[nodeId];
    if (nodeVisible) {
      this.setState({expandedNodes: omit(this.state.expandedNodes, nodeId)});
    } else {
      this.setState({expandedNodes: {...this.state.expandedNodes, [nodeId]: true}});
    }
  }

  render() {
    return <TreeNode
      id={this.props.rootId}
      data={this.props.data}
      expandedNodes={this.state.expandedNodes}
      toggleNode={this.toggleNode}
      highlightedId={this.props.highlightedId}
    />;
  }
}

class TreeNode extends React.Component {
  render() {
    const {id, data, highlightedId, expandedNodes} = this.props;
    const nodeData = data[id];
    const reports = nodeData.reports || [];
    return (
      <div className='node'>
        <div
          className={cx({
            info: true,
            expandable: reports.length,
            expanded: expandedNodes[id],
            highlighted: highlightedId === id
          })}
          onClick={() => this.props.toggleNode(id)}
        >
          <i />
          <h4>{nodeData.fullName}</h4>
          <span>{nodeData.position}</span>
          <span>{nodeData.location}</span>
        </div>
        {expandedNodes[id] && !!reports.length &&
          <div className='reports'>
            {reports.map((reportId) => {
              return <TreeNode
                key={reportId}
                {...this.props}
                id={reportId}
              />;
            })}
          </div>
        }
      </div>
    );
  }
}

ReactDOM.render(
  <Router history={browserHistory}>
    <Route path='/' component={App}>
      <IndexRoute component={DashboardPage} />
      <Route path='tree/:time(/:highlight)' component={TreeViewPage} />
      <Redirect from='*' to='/' />
    </Route>
  </Router>,
  document.getElementById('container')
);
