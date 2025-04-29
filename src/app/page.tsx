'use client';
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import styles from './Home.module.css';

type tw_data = {
  date: string;
  nickname: string;
  level: number;
  exp: number;
  job: string;
  job_code: number;
  jobTab: number;
  profile_code: string;
  profile_image_url: string;
  popular: number;
  levelup_exp: number;
  daily_exp_diff: number;
  weekly_exp_diff: number;
  job_ranking: number;
  specific_job_ranking: number;
};

const jobTabNames: { [key: number]: string } = {
  0: '全部',
  1: '劍士',
  2: '弓箭手',
  3: '法師',
  4: '盜賊',
  5: '海盜',
  6: '人氣',
  7: '公會'
};

const jobOrder: { [key: number]: string[] } = {
  1: ['狂戰士', '見習騎士', '槍騎兵'],
  2: ['獵人', '弩弓手'],
  3: ['僧侶', '冰雷巫師', '火毒巫師'],
  4: ['刺客', '俠盜'],
  5: ['槍手', '打手'],
};

//const external_profile_url = 'https://maplestoryworlds.nexon.com/zh-tw/profile/';

export default function Home() {
  const [data, setData] = useState<tw_data[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobTab, setSelectedJobTab] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ column: 'daily_exp_diff' | null; direction: 'asc' | 'desc' | null }>({ column: null, direction: null });

  const handleSort = (columnName: 'daily_exp_diff') => {
    setSortConfig(prevConfig => {
      if (prevConfig.column === columnName) {
        // 如果點擊當前已排序的欄位，切換方向 (desc -> asc -> null)
        if (prevConfig.direction === 'desc') {
          return { column: columnName, direction: 'asc' };
        } else if (prevConfig.direction === 'asc') {
          return { column: null, direction: null }; // 取消排序
        } else {
          return { column: columnName, direction: 'desc' }; // 默認降冪
        }
      } else {
        // 點擊新的欄位，設置為該欄位的降冪排序
        // 因為目前只有 'daily_exp_diff' 可排序，這裡簡單設置即可
        return { column: columnName, direction: 'desc' };
      }
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('https://script.google.com/macros/s/AKfycbxvB4T6ndgWqRlJIovqKqqdNOHlnfw4uevMhHw35MbBjmDNw_7_beKoy-xQQV5jQXn9/exec?sheet=tw_data');

        if (!res.ok) {
          console.error('HTTP 錯誤', res.status);
          setData([]);
          setIsLoading(false);
          return;
        }

        const json = await res.json();
        const sheetData = json.tw_data;

        if (Array.isArray(sheetData)) {
          const validData: tw_data[] = sheetData.map((player: {
            date?: string | null | undefined;
            nickname?: string | null | undefined;
            level?: string | number | null | undefined;
            exp?: string | number | null | undefined;
            job?: string | null | undefined;
            job_code?: string | number | null | undefined;
            jobTab?: string | number | null | undefined;
            profile_code?: string | null | undefined;
            profile_image_url?: string | null | undefined;
            popular?: string | number | null | undefined;
            levelup_exp?: string | number | null | undefined;
            daily_exp_diff?: string | number | null | undefined;
            weekly_exp_diff?: string | number | null | undefined;
            job_ranking?: string | number | null | undefined;
            specific_job_ranking?: string | number | null | undefined;
          }) => {
            return {
              date: String(player.date || ''),
              nickname: String(player.nickname || ''),
              job: String(player.job || ''),
              profile_code: String(player.profile_code || ''),
              profile_image_url: String(player.profile_image_url || ''),

              level: Number(player.level) || 0,
              exp: Number(player.exp) || 0,
              job_code: Number(player.job_code) || 0,
              jobTab: Number(player.jobTab) || 0,
              popular: Number(player.popular) || 0,
              levelup_exp: Number(player.levelup_exp) || 0,
              daily_exp_diff: Number(player.daily_exp_diff) || 0,
              weekly_exp_diff: Number(player.weekly_exp_diff) || 0,
              job_ranking: Number(player.job_ranking) || 0,
              specific_job_ranking: Number(player.specific_job_ranking) || 0,
            };
          });

          let latestData: tw_data[] = [];
          const allDateStrings = validData.map(item => item.date).filter(d => d);
          const uniqueDateStrings = Array.from(new Set(allDateStrings));

          if (uniqueDateStrings.length > 0) {
            const sortedDateStrings = uniqueDateStrings.sort((a, b) => b.localeCompare(a));

            let dateIndex = 0;
            while (latestData.length === 0 && dateIndex < sortedDateStrings.length) {
              const targetDateString = sortedDateStrings[dateIndex];
              latestData = validData.filter(item => item.date === targetDateString);
              dateIndex++;
            }
          }
          setData(latestData);

        } else {
          console.error('資料格式錯誤：預期 json.tw_data 是陣列', json);
          setData([]);
        }
      } catch (error) {
        console.error('抓資料失敗', error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

  }, []);

  const uniqueJobTabs = useMemo(() => {
    const tabs = data
      .map(player => player.jobTab)
      .filter(tab => typeof tab === 'number' && !isNaN(tab))
      .reduce((acc, tab) => {
        acc.add(tab);
        return acc;
      }, new Set<number>());
    return Array.from(tabs).sort((a, b) => a - b);
  }, [data]);

  const uniqueAndOrderedJobsForSelectedTab = useMemo(() => {
    if (selectedJobTab === null || !jobOrder[selectedJobTab]) {
      return [];
    }

    const dataForSelectedTab = data.filter(player => player.jobTab === selectedJobTab);
    const existingJobs = new Set(dataForSelectedTab.map(player => player.job).filter(job => job));
    const definedOrder = jobOrder[selectedJobTab] || [];

    const orderedJobs = definedOrder.filter(jobName => existingJobs.has(jobName));
    const unOrderedJobs = Array.from(existingJobs).filter(jobName => !definedOrder.includes(jobName));

    return [...orderedJobs, ...unOrderedJobs.sort()];

  }, [data, selectedJobTab]);


  // 修改：在過濾後增加排序邏輯
  const filteredData = useMemo(() => {
    let filtered = data.filter(player => {
      const searchMatch = player.nickname?.toLowerCase().includes(search.toLowerCase());

      const jobTabMatch = selectedJobTab === null
        ? player.jobTab === 0
        : player.jobTab === selectedJobTab;

      const jobMatch = selectedJob === null || player.job === selectedJob;

      return searchMatch && jobTabMatch && jobMatch;
    });

    // 應用排序
    if (sortConfig.column !== null && sortConfig.direction !== null) {
      filtered = [...filtered].sort((a, b) => {
        let aValue;
        let bValue;

        // 修改：只處理 'daily_exp_diff' 的排序邏輯
        switch (sortConfig.column) {
          case 'daily_exp_diff':
            aValue = a.daily_exp_diff;
            bValue = b.daily_exp_diff;
            break;
          default:
            // 如果 sortConfig.column 是未知的，不排序 (這個 default 其實不太會跑到)
            return 0;
        }

        // 確保值是數字以便正確比較
        const numA = Number(aValue);
        const numB = Number(bValue);


        let comparison = 0;
        if (numA > numB) {
          comparison = 1;
        } else if (numA < numB) {
          comparison = -1;
        }

        // 根據排序方向調整比較結果
        return sortConfig.direction === 'desc' ? (comparison * -1) : comparison;
      });
    }

    return filtered; // 返回排序後的數據
  }, [data, search, selectedJobTab, selectedJob, sortConfig]);

  // 頁面開始
  return (
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        <h1 className={styles.heading}>排行榜</h1>

        {/* 第一排：Job Tabs */}
        {isLoading ? (
          <p className={styles.messageText}>資料載入中...</p>
        ) : (
          <div className={styles.tabsContainer}>
            {/* "全部" 頁籤 */}
            <button
              key={0}
              className={`${styles.tabButton} ${selectedJobTab === null ? styles.tabButtonActivePrimary : styles.tabButtonInactive}`}
              onClick={() => {
                setSelectedJobTab(null);
                setSelectedJob(null);
                setSearch('');
              }}
            >
              {jobTabNames[0] || '全部'}
            </button>
            {/* 其他 jobTab 頁籤 */}
            {uniqueJobTabs.map(tabValue => {
              if (tabValue === 0) return null;

              const tabName = jobTabNames[tabValue] || `未知分類 (${tabValue})`;
              return (
                <button
                  key={tabValue}
                  className={`${styles.tabButton} ${selectedJobTab === tabValue ? styles.tabButtonActivePrimary : styles.tabButtonInactive}`}
                  onClick={() => {
                    setSelectedJobTab(tabValue);
                    setSelectedJob(null);
                    setSearch('');
                  }}
                >
                  {tabName}
                </button>
              );
            })}
            {/* 顯示當前資料的日期 */}
            {!isLoading && data.length > 0 && data[0].date && (
              <span className={styles.dateDisplay}>
                最後更新: {new Date(data[0].date).toLocaleDateString('sv-SE').replaceAll('-', '/')}
              </span>
            )}
          </div>
        )}

        {/* 第二排：Job 分類按鈕 */}
        {!isLoading && selectedJobTab !== null && jobOrder[selectedJobTab] && uniqueAndOrderedJobsForSelectedTab.length > 0 && (
          <div className={styles.subTabsContainer}>
            {/* 該 jobTab 下的「全部分支」按鈕 */}
            <button
              key="all-jobs"
              className={`${styles.tabButton} ${selectedJob === null ? styles.subTabButtonActive : styles.subTabButtonInactive}`}
              onClick={() => {
                setSelectedJob(null);
                setSearch('');
              }}
            >
              全部分支
            </button>
            {uniqueAndOrderedJobsForSelectedTab.map(jobName => (
              <button
                key={jobName}
                className={`${styles.tabButton} ${selectedJob === jobName ? styles.subTabButtonActive : styles.subTabButtonInactive}`}
                onClick={() => {
                  setSelectedJob(jobName);
                  setSearch('');
                }}
              >
                {jobName}
              </button>
            ))}
          </div>
        )}

        {/* search bar */}
        <input
          type="text"
          placeholder={
            selectedJobTab === null
              ? `搜尋${jobTabNames[0] || '全部'}中的暱稱...`
              : selectedJob === null
                ? `搜尋${jobTabNames[selectedJobTab] || `頁籤 ${selectedJobTab}`}中的暱稱...`
                : `搜尋${selectedJob}中的暱稱...`
          }
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchBar}
        />

        {/* 資料列表 */}
        {isLoading ? (
          <p className={styles.messageText}>資料載入中...</p>
        ) : filteredData.length > 0 ? (
          <> {/* Fragment */}
            {/* 桌面版表格 */}
            <table className={styles.desktopTable}>
              <thead>
                <tr>
                  <th>
                    #
                  </th>
                  <th>頭像</th>
                  <th>暱稱 / 職業 / 等級</th>
                  <th>經驗值</th>
                  <th>
                    <button className={styles.sortButton} onClick={() => handleSort('daily_exp_diff')}>
                      {
                        sortConfig.column === 'daily_exp_diff' ?
                          (sortConfig.direction === 'desc' ? '每日卷王' : '每日成長最少')
                          :
                          '日經驗成長'
                      }
                      {sortConfig.column === 'daily_exp_diff' && (
                        <span className={`${styles.sortIndicator} ${sortConfig.direction === 'asc' ? styles.sortIndicatorAsc : styles.sortIndicatorDesc}`}></span>
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((player, idx) => (
                  <tr
                    key={player.profile_code || idx}
                    className={`${styles.playerRow} ${idx % 2 === 0 ? styles.desktopRowEven : styles.desktopRowOdd}`}
                  >
                    <td>{idx + 1}</td>
                    <td>
                      <div className={styles.profileImageWrapper}>
                        <Image
                          src={player.profile_image_url || '/default_avatar.png'}
                          alt={player.profile_image_url ? `${player.nickname}的頭像` : '預設玩家頭像'}
                          width={192}
                          height={192}
                          className={styles.profileImage}
                        />
                      </div>
                    </td>
                    <td>
                      <div className={styles.cardTextInfo}>
                        <h2 className={styles.nickname}>{player.nickname} <span className={styles.profileCode}>#{player.profile_code}</span></h2>
                        <p className={styles.cardText}>{player.job} Lv. {player.level}</p>
                      </div>
                    </td>
                    <td>
                      <p className={styles.cardText}>{player.exp.toLocaleString()}</p>
                    </td>
                    <td>
                      <p className={`${styles.cardText} ${player.daily_exp_diff >= 0 ? styles.dailyExpPositive : styles.dailyExpNegative}`}>
                        {player.daily_exp_diff >= 0 ? '+' : ''}{player.daily_exp_diff.toLocaleString()}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 手機版名片列表 */}
            <div className={styles.mobileCardContainer}>
              {filteredData.map((player, idx) => (
                <div
                  key={player.profile_code || idx}
                  className={`${styles.mobileCard} ${idx % 2 === 0 ? styles.mobileCardEven : styles.mobileCardOdd}`}
                >
                  {/* 手機版名片主要內容 (頭像 + 暱稱/職業) */}
                  <div className={styles.mobileCardContent}>
                    <div className={styles.profileImageWrapper}>
                      <Image
                        src={player.profile_image_url || '/default_avatar.png'}
                        alt={player.profile_image_url ? `${player.nickname}'s profile image` : '預設玩家頭像'}
                        width={192}
                        height={192}
                        className={styles.profileImage}
                      />
                    </div>
                    {/* 暱稱 / 職業 / 等級 */}
                    <div className={styles.mobileCardTextInfo}>
                      <h2 className={styles.nickname}>{player.nickname} <span className={styles.profileCode}>#{player.profile_code}</span></h2>
                      <p className={styles.cardText}>{player.job} Lv. {player.level}</p>
                    </div>
                  </div>
                  {/* 手機版額外詳細資訊 (經驗值 / 成長) */}
                  <div className={styles.mobileCardDetails}>
                    <p className={styles.cardText}>經驗值: {player.exp.toLocaleString()}</p>
                    <p className={`${styles.cardText} ${player.daily_exp_diff >= 0 ? styles.dailyExpPositive : styles.dailyExpNegative}`}>
                      日經驗成長: {player.daily_exp_diff >= 0 ? '+' : ''}{player.daily_exp_diff.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </>
        ) : (
          data.length > 0 && (search !== '' || selectedJobTab !== null || selectedJob !== null) ? (
            <p className={styles.messageText}>無符合搜尋或篩選條件的結果。</p>
          ) : (
            !isLoading && data.length === 0 ? (
              <p className={styles.messageText}>目前沒有資料。</p>
            ) : (
              null
            )
          )
        )}

      </div>
    </div >
  );
}