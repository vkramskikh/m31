import './styles/main.less';

import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import {difference, memoize, sortBy} from 'lodash';

const parseTime = memoize((time) => Number(moment(time, 'ddd MMM DD HH:mm:ss z YYYY')));

class App extends React.Component {
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
      <div>
        <h1>{'m31'}</h1>
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
      </div>
    );
  }
}

const columns = [
  'id', 'fullName', 'managerId', 'location', 'department',
  'gradeType', 'position', 'category', 'jobDescription'
];

class DiffList extends React.Component {
  static defaultProps = {columns}

  render() {
    const {timeStart, timeEnd, dataStart, dataEnd} = this.props;
    console.log(dataStart);
    const dataStartKeys = Object.keys(dataStart);
    const dataEndKeys = Object.keys(dataEnd);
    const removedKeys = difference(dataStartKeys, dataEndKeys);
    const addedKeys = difference(dataEndKeys, dataStartKeys);
    return (
      <tbody>
        <tr>
          <td colSpan={this.props.columns.length}>
            <h3>{timeStart}{' → '}{timeEnd}</h3>
          </td>
        </tr>
        {removedKeys.map((key) => {
          return <DiffEntry
            key={key}
            mode='remove'
            data={dataStart[key]}
          />;
        })}
        {addedKeys.map((key) => {
          return <DiffEntry
            key={key}
            mode='add'
            data={dataEnd[key]}
          />;
        })}
      </tbody>
    );
  }
}

class DiffEntry extends React.Component {
  static defaultProps = {columns, mode: 'diff'}

  render() {
    const {columns, mode, data} = this.props;
    const className = {remove: 'danger', add: 'success'}[mode] || null;
    return (
      <tr className={className}>
        {columns.map((column) => {
          return <td key={column}>{data[column]}</td>;
        })}
      </tr>
    );
  }
}

(async () => {
  const response = await fetch('/data');
  const data = await response.json();
  ReactDOM.render(
    <App data={data} />,
    document.getElementById('container')
  );
})();
