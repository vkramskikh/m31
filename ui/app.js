import './styles/main.less';

import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, IndexRoute, Redirect, Link, browserHistory} from 'react-router';
import moment from 'moment';
import {difference, intersection, isEqual, pick, memoize, sortBy} from 'lodash';

const parseTime = memoize((time) => Number(moment(time, 'ddd MMM DD HH:mm:ss z YYYY')));

let store = {data: null};

const columns = [
  'id', 'fullName', 'managerId', 'location', 'department',
  'gradeType', 'position', 'category', 'jobDescription'
];

class App extends React.Component {
  static defaultProps = {store}

  render() {
    return (
      <div>
        <Link to='/'><h1>{'m31'}</h1></Link>
        {React.cloneElement(
          React.Children.only(this.props.children),
          {data: this.props.store.data}
        )}
      </div>
    );
  }
}

class Dashboard extends React.Component {
  static defaultProps = {store}

  render() {
    const {data} = this.props;
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
  static defaultProps = {columns}

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
              <Link to={'tree/' + timeStart}>{timeStart}</Link>
              {' → '}
              <Link to={'tree/' + timeEnd}>{timeEnd}</Link>
            </h3>
          </td>
        </tr>
        {removedKeys.map((key) => {
          return <DiffEntry
            key={key}
            mode='remove'
            dataStart={dataStart[key]}
          />;
        })}
        {addedKeys.map((key) => {
          return <DiffEntry
            key={key}
            mode='add'
            dataEnd={dataEnd[key]}
          />;
        })}
        {changedKeys.map((key) => {
          return <DiffEntry
            key={key}
            mode='diff'
            dataStart={dataStart[key]}
            dataEnd={dataEnd[key]}
          />;
        })}
      </tbody>
    );
  }
}

class DiffEntry extends React.Component {
  static defaultProps = {columns, mode: 'diff'}

  render() {
    const {columns, mode, dataStart, dataEnd} = this.props;
    const className = {remove: 'danger', add: 'success'}[mode] || null;
    return (
      <tr className={className}>
        {columns.map((column) => {
          return <td key={column}>{
            mode === 'add' ?
              dataEnd[column]
            : mode === 'remove' ?
              dataStart[column]
            : dataStart[column] === dataEnd[column] ?
              dataStart[column]
            :
              [
                <div key='removed' className='diff-removed'>{dataStart[column]}</div>,
                <div key='added' className='diff-added'>{dataEnd[column]}</div>
              ]
          }</td>;
        })}
      </tr>
    );
  }
}

class TreeView extends React.Component {
  render() {
    return (
      <div>
        <h3>{this.props.params.time}</h3>
        {'TBD'}
      </div>
    );
  }
}

(async () => {
  const response = await fetch('/data');
  store.data = await response.json();
  ReactDOM.render(
    <Router history={browserHistory}>
      <Route path='/' component={App}>
        <IndexRoute component={Dashboard} />
        <Route path='tree/:time' component={TreeView} />
        <Redirect from='*' to='/' />
      </Route>
    </Router>,
    document.getElementById('container')
  );
})();
