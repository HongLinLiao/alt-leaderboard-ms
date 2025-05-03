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
  isNewlyListed: boolean;
};

const jobTabNames: { [key: number]: string } = {
  0: '全部',
  1: '劍士',
  2: '弓箭手',
  3: '法師',
  4: '盜賊',
  5: '海盜',
  7: '公會'
};

const jobOrder: { [key: number]: string[] } = {
  1: ['狂戰士', '見習騎士', '槍騎兵'],
  2: ['獵人', '弩弓手'],
  3: ['僧侶', '冰雷巫師', '火毒巫師'],
  4: ['刺客', '俠盜'],
  5: ['槍手', '打手'],
};

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
        if (prevConfig.direction === 'desc') {
          return { column: columnName, direction: 'asc' };
        } else if (prevConfig.direction === 'asc') {
          return { column: null, direction: null };
        } else {
          return { column: columnName, direction: 'desc' };
        }
      } else {
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
          const sortedSheetData = [...sheetData].sort((a, b) => {
            const dateA = String(a.date || '');
            const dateB = String(b.date || '');
            return dateB.localeCompare(dateA);
          });

          const validData: tw_data[] = sortedSheetData.map((player: {
            date?: string | number | null | undefined;
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
            const rawDailyExpDiff = player.daily_exp_diff;
            const isNewlyListed = rawDailyExpDiff === null || rawDailyExpDiff === undefined || rawDailyExpDiff === '';
            const dailyExpDiff = Number(rawDailyExpDiff) || 0;


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
              daily_exp_diff: dailyExpDiff,
              weekly_exp_diff: Number(player.weekly_exp_diff) || 0,
              job_ranking: Number(player.job_ranking) || 0,
              specific_job_ranking: Number(player.specific_job_ranking) || 0,
              isNewlyListed: isNewlyListed,
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
    const sortedTabs = Array.from(tabs).sort((a, b) => a - b);
    if (!sortedTabs.includes(0)) {
      sortedTabs.unshift(0);
    }
    return sortedTabs.filter(tabValue => tabValue !== 6);

  }, [data]);

  const uniqueAndOrderedJobsForSelectedTab = useMemo(() => {
    if (selectedJobTab === null || selectedJobTab === 0) {
      const existingJobs = new Set(data.map(player => player.job).filter(job => job));
      return Array.from(existingJobs).sort();
    }

    const dataForSelectedTab = data.filter(player => player.jobTab === selectedJobTab);
    const existingJobs = new Set(dataForSelectedTab.map(player => player.job).filter(job => job));
    const definedOrder = jobOrder[selectedJobTab] || [];

    const orderedJobs = definedOrder.filter(jobName => existingJobs.has(jobName));
    const unOrderedJobs = Array.from(existingJobs).filter(jobName => !definedOrder.includes(jobName));

    return [...orderedJobs, ...unOrderedJobs.sort()];

  }, [data, selectedJobTab]);

  const filteredData = useMemo(() => {
    let filtered = data.filter(player => {
      const searchMatch = player.nickname?.toLowerCase().includes(search.toLowerCase());

      const jobTabMatch = selectedJobTab === null
        ? player.jobTab === 0
        : player.jobTab === selectedJobTab;

      const jobMatch = selectedJob === null || player.job === selectedJob;

      return searchMatch && jobTabMatch && jobMatch;
    });

    if (sortConfig.column !== null && sortConfig.direction !== null) {
      filtered = [...filtered].sort((a, b) => {

        if (sortConfig.column === 'daily_exp_diff') {
          const aIsNewlyListed = a.isNewlyListed;
          const bIsNewlyListed = b.isNewlyListed;

          if (aIsNewlyListed && !bIsNewlyListed) {
            return 1;
          }
          if (!aIsNewlyListed && bIsNewlyListed) {
            return -1;
          }
          if (aIsNewlyListed && bIsNewlyListed) {
            return 0;
          }
        }

        let aValue;
        let bValue;

        switch (sortConfig.column) {
          case 'daily_exp_diff':
            aValue = a.daily_exp_diff;
            bValue = b.daily_exp_diff;
            break;
          default:
            return 0;
        }

        const numA = Number(aValue);
        const numB = Number(bValue);

        let comparison = 0;
        if (numA > numB) {
          comparison = 1;
        } else if (numA < numB) {
          comparison = -1;
        }

        return sortConfig.direction === 'desc' ? (comparison * -1) : comparison;
      });
    }

    if (selectedJobTab === null) {
      filtered = filtered.slice(0, 100);
    }

    return filtered;
  }, [data, search, selectedJobTab, selectedJob, sortConfig]);


  return (
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        <h1 className={styles.heading}>排行榜</h1>

        {isLoading ? (
          <p className={styles.messageText}>資料載入中...</p>
        ) : (
          <div className={styles.tabsContainer}>
            {uniqueJobTabs.map(tabValue => {
              const tabName = jobTabNames[tabValue] || `未知分類 (${tabValue})`;
              const isActive = selectedJobTab === null ? tabValue === 0 : selectedJobTab === tabValue;

              return (
                <button
                  key={tabValue}
                  className={`${styles.tabButton} ${isActive ? styles.tabButtonActivePrimary : styles.tabButtonInactive}`}
                  onClick={() => {
                    setSelectedJobTab(tabValue === 0 ? null : tabValue);
                    setSelectedJob(null);
                    setSearch('');
                  }}
                >
                  {tabName}
                </button>
              );
            })}
            {!isLoading && data.length > 0 && data[0].date && (
              <span className={styles.dateDisplay}>
                最後更新: {new Date(data[0].date).toLocaleDateString('sv-SE').replaceAll('-', '/')} - 09:00
              </span>
            )}
          </div>
        )}

        {/* 第二排：Job 分類按鈕 - 只有當選中的不是 JobTab 0 時才顯示 */}
        {!isLoading && selectedJobTab !== null && selectedJobTab !== 0 && uniqueAndOrderedJobsForSelectedTab.length > 0 && (
          <div className={styles.subTabsContainer}>
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

        {isLoading ? (
          <p className={styles.messageText}>資料載入中...</p>
        ) : filteredData.length > 0 ? (
          <>
            <div className={styles.mobileSortControl}>
              <button className={styles.sortButton} onClick={() => handleSort('daily_exp_diff')}>
                {
                  sortConfig.column === 'daily_exp_diff' ?
                    (sortConfig.direction === 'desc' ? '每日卷王' : '每日混子')
                    :
                    '預設排名'
                }
                {sortConfig.column === 'daily_exp_diff' && (
                  <span className={`${styles.sortIndicator} ${sortConfig.direction === 'asc' ? styles.sortIndicatorAsc : styles.sortIndicatorDesc}`}></span>
                )}
              </button>
            </div>

            <table className={styles.desktopTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>頭像</th>
                  <th>暱稱 / 職業 / 等級</th>
                  <th>經驗值</th>
                  <th>
                    <button className={styles.sortButton} onClick={() => handleSort('daily_exp_diff')}>
                      {
                        sortConfig.column === 'daily_exp_diff' ?
                          (sortConfig.direction === 'desc' ? '每日卷王' : '每日混子')
                          :
                          '經驗變化'
                      }
                      {sortConfig.column === 'daily_exp_diff' && (
                        <span className={`${styles.sortIndicator} ${styles.sortIndicatorAsc}`}></span>
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((player, idx) => {
                  const expPercentage = player.levelup_exp && player.levelup_exp > 0
                    ? (player.exp / player.levelup_exp) * 100
                    : 0;

                  const clampedPercentage = Math.max(0, Math.min(100, expPercentage));
                  const givePriority = idx < 5;

                  const isNewlyListed = player.isNewlyListed;


                  return (
                    <tr
                      key={player.profile_code || idx}
                      className={`${styles.playerRow} ${idx % 2 === 0 ? styles.desktopRowEven : styles.desktopRowOdd}`}
                    >
                      <td>{idx + 1}</td>
                      <td>
                        <div className={styles.profileImageWrapper}>
                          <Image
                            src={player.profile_image_url || '/default_avatar.png'}
                            alt={player.profile_image_url ? `${player.nickname}` : '預設玩家頭像'}
                            width={192}
                            height={192}
                            className={styles.profileImage}
                            {...(givePriority && { priority: true })}
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
                        <div className={styles.expProgressContainer}>
                          <div className={styles.expProgressText}>
                            <span>EXP: {player.exp.toLocaleString()} / {player.levelup_exp ? player.levelup_exp.toLocaleString() : '-'}</span>
                            <span>{clampedPercentage.toFixed(2)}%</span>
                          </div>
                          <div className={styles.progressBarTrack}>
                            <div
                              className={styles.progressBarFill}
                              style={{ width: `${clampedPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {/* 應用新上榜的 CSS 類別，並只顯示文字 */}
                        <p className={`${styles.cardText} ${isNewlyListed ? styles.newlyListedBadge : (player.daily_exp_diff >= 0 ? styles.dailyExpPositive : styles.dailyExpNegative)}`}>
                          {isNewlyListed ? "新上榜" : (player.daily_exp_diff >= 0 ? '+' : '') + player.daily_exp_diff.toLocaleString()}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className={styles.mobileCardContainer}>
              {filteredData.map((player, idx) => {
                const expPercentage = player.levelup_exp && player.levelup_exp > 0
                  ? (player.exp / player.levelup_exp) * 100
                  : 0;

                const clampedPercentage = Math.max(0, Math.min(100, expPercentage));
                const givePriority = idx < 5;

                const isNewlyListed = player.isNewlyListed;


                return (
                  <div
                    key={player.profile_code || idx}
                    className={`${styles.mobileCard} ${idx % 2 === 0 ? styles.mobileCardEven : styles.mobileCardOdd}`}
                  >
                    <div className={styles.mobileRank}>
                      #{idx + 1}
                    </div>
                    <div className={styles.mobileCardContent}>
                      <div className={styles.profileImageWrapper}>
                        <Image
                          src={player.profile_image_url || '/default_avatar.png'}
                          alt={player.profile_image_url ? `${player.nickname}` : '預設玩家頭像'}
                          width={192}
                          height={192}
                          className={styles.profileImage}
                          {...(givePriority && { priority: true })}
                        />
                      </div>
                      <div className={styles.mobileCardTextInfo}>
                        <h2 className={styles.nickname}>{player.nickname} <span className={styles.profileCode}>#{player.profile_code}</span></h2>
                        <p className={styles.cardText}>{player.job} Lv. {player.level}</p>
                      </div>
                    </div>
                    <div className={styles.mobileCardDetails}>
                      <div className={styles.expProgressContainer}>
                        <div className={styles.expProgressText}>
                          <span>EXP: {player.exp.toLocaleString()} / {player.levelup_exp ? player.levelup_exp.toLocaleString() : '-'}</span>
                          <span>{clampedPercentage.toFixed(2)}%</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div
                            className={styles.progressBarFill}
                            style={{ width: `${clampedPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* 應用新上榜的 CSS 類別，並根據狀態決定是否顯示 "經驗變化: " 前綴 */}
                      <p className={`${styles.cardText} ${isNewlyListed ? styles.newlyListedBadge : (player.daily_exp_diff >= 0 ? styles.dailyExpPositive : styles.dailyExpNegative)}`}>
                        {isNewlyListed ? (
                          "新上榜"
                        ) : (
                          `經驗變化: ${(player.daily_exp_diff >= 0 ? '+' : '') + player.daily_exp_diff.toLocaleString()}`
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
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
    </div>
  );
}