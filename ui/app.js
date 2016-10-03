import './styles/main.less';

import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, IndexRoute, Redirect, Link, browserHistory} from 'react-router';
import moment from 'moment';
import {difference, intersection, isEqual, pick, memoize, sortBy} from 'lodash';

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

class Dashboard extends React.Component {
  static defaultProps = {
    columns: [
      'id', 'fullName', 'managerId', 'location', 'department',
      'gradeType', 'position', 'category', 'jobDescription'
    ]
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
            columns={columns}
            dataStart={dataStart[key]}
          />;
        })}
        {addedKeys.map((key) => {
          return <DiffEntry
            key={key}
            mode='add'
            columns={columns}
            dataEnd={dataEnd[key]}
          />;
        })}
        {changedKeys.map((key) => {
          return <DiffEntry
            key={key}
            mode='diff'
            columns={columns}
            dataStart={dataStart[key]}
            dataEnd={dataEnd[key]}
          />;
        })}
      </tbody>
    );
  }
}

class DiffEntry extends React.Component {
  static defaultProps = {mode: 'diff'}

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
