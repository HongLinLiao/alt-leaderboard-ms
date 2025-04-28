'use client';
import { useEffect, useState, useMemo } from 'react';

// 定義資料的型別 (與之前相同)
type tw_data = {
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

// 定義 jobTab 數值與顯示名稱的對應表 (與之前相同)
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

// 定義每個 jobTab 下，職業 (job) 的固定順序列表 (與之前相同)
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
  // 新增 state：目前選擇的 jobTab (null 表示全部)
  const [selectedJobTab, setSelectedJobTab] = useState<number | null>(null);
  // 新增 state：目前選擇的具體職業 (null 表示該 jobTab 下的全部職業)
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

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
          const validData = sheetData.map(player => {
            return {
              nickname: player.nickname || '',
              level: typeof player.level === 'number' ? player.level : parseFloat(player.level) || 0,
              exp: typeof player.exp === 'number' ? player.exp : parseFloat(player.exp) || 0,
              job: player.job || '', // 確保 job 是字串
              job_code: typeof player.job_code === 'number' ? player.job_code : parseFloat(player.job_code) || 0,
              jobTab: typeof player.jobTab === 'number' ? player.jobTab : parseFloat(player.jobTab) || 0,
              profile_code: player.profile_code || '',
              profile_image_url: player.profile_image_url || '',
              popular: typeof player.popular === 'number' ? player.popular : parseFloat(player.popular) || 0,
              levelup_exp: typeof player.levelup_exp === 'number' ? player.levelup_exp : parseFloat(player.levelup_exp) || 0,
              daily_exp_diff: typeof player.daily_exp_diff === 'number' ? player.daily_exp_diff : parseFloat(player.daily_exp_diff) || 0,
              weekly_exp_diff: typeof player.weekly_exp_diff === 'number' ? player.weekly_exp_diff : parseFloat(player.weekly_exp_diff) || 0,
              job_ranking: typeof player.job_ranking === 'number' ? player.job_ranking : parseFloat(player.job_ranking) || 0,
              specific_job_ranking: typeof player.specific_job_ranking === 'number' ? player.specific_job_ranking : parseFloat(player.specific_job_ranking) || 0,
            };
          });
          setData(validData);
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

  // 計算不重複的 jobTab 值 (用於第一排頁籤)
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

  // 計算選中的 jobTab 下，不重複且按固定順序排列的職業列表 (用於第二排按鈕)
  const uniqueAndOrderedJobsForSelectedTab = useMemo(() => {
    if (selectedJobTab === null) {
      return [];
    }

    const dataForSelectedTab = data.filter(player => player.jobTab === selectedJobTab);
    const existingJobs = new Set(dataForSelectedTab.map(player => player.job).filter(job => job));
    const definedOrder = jobOrder[selectedJobTab] || [];

    const orderedJobs = definedOrder.filter(jobName => existingJobs.has(jobName));
    const unOrderedJobs = Array.from(existingJobs).filter(jobName => !definedOrder.includes(jobName));

    return [...orderedJobs, ...unOrderedJobs.sort()];

  }, [data, selectedJobTab]);

  // 過濾資料：同時根據搜尋文字、選擇的 jobTab 和 選擇的 job
  const filteredData = data.filter(player => {
    const searchMatch = player.nickname?.toLowerCase().includes(search.toLowerCase());
    const jobTabMatch = selectedJobTab === null || player.jobTab === selectedJobTab;
    const jobMatch = selectedJob === null || player.job === selectedJob;
    return searchMatch && jobTabMatch && jobMatch;
  });


  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-4">排行榜</h1>

        {/* 第一排：Job Tabs */}
        {isLoading ? (
          <p>載入頁籤...</p>
        ) : (
          <div className="mb-4 flex flex-wrap gap-2">
            {/* "全部" 頁籤 - 顯示 jobTabNames[0] 的名稱 */}
            <button
              key={0} // 使用 0 作為全部的 key
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${selectedJobTab === null // 當 selectedJobTab 是 null 時表示選中「全部」
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              onClick={() => {
                setSelectedJobTab(null); // 設定為 null 表示全部
                setSelectedJob(null); // 重設選中的 job 為全部
                setSearch(''); // 清空搜尋
              }}
            >
              {jobTabNames[0] || '全部'} {/* 使用 jobTabNames[0] 作為名稱 */}
            </button>
            {/* 根據 uniqueJobTabs 生成第一排頁籤 */}
            {uniqueJobTabs.map(tabValue => {
              // 過濾掉 jobTabNames 裡定義的「全部」那個 key (例如 0)
              if (tabValue === 0) return null;

              const tabName = jobTabNames[tabValue] || `未知分類 (${tabValue})`;
              return (
                <button
                  key={tabValue}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${selectedJobTab === tabValue
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
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
          </div>
        )}

        {/* *** 修改：第二排：Job 分類按鈕 的顯示條件 *** */}
        {/* 只有在載入完成 AND selectedJobTab 不為 null AND selectedJobTab 是 1 到 5 之間 AND 該頁籤下有實際職業資料時才顯示 */}
        {!isLoading && selectedJobTab !== null && selectedJobTab >= 1 && selectedJobTab <= 5 && uniqueAndOrderedJobsForSelectedTab.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {/* 該 jobTab 下的「全部職業」按鈕 */}
            <button
              key="all-jobs"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${selectedJob === null
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              onClick={() => {
                setSelectedJob(null);
                setSearch('');
              }}
            >
              全部分支 {/* 這裡只顯示「全部職業」即可 */}
            </button>

            {/* 根據 uniqueAndOrderedJobsForSelectedTab 生成第二排職業按鈕 */}
            {uniqueAndOrderedJobsForSelectedTab.map(jobName => (
              <button
                key={jobName}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${selectedJob === jobName
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
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
        {/* ************************************************** */}


        {/* search bar (與之前相同，更新 placeholder) */}
        <input
          type="text"
          placeholder={
            selectedJobTab === null
              ? '搜尋全部暱稱...'
              : selectedJob === null
                ? `搜尋${jobTabNames[selectedJobTab] || `頁籤 ${selectedJobTab}`}中的暱稱...`
                : `搜尋${selectedJob}中的暱稱...`
          }
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-6 p-2 border rounded"
        />

        {/* 資料表格或載入/無資料訊息 (與之前相同) */}
        {isLoading ? (
          <p className="text-center">資料載入中...</p>
        ) : filteredData.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2">暱稱</th>
                <th className="border p-2">等級</th>
                <th className="border p-2">職業</th>
                <th className="border p-2">人氣</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((player, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{player.nickname}</td>
                  <td className="border p-2">{player.level}</td>
                  <td className="border p-2">{player.job}</td>
                  <td className="border p-2">{player.popular}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          data.length > 0 && (search !== '' || selectedJobTab !== null || selectedJob !== null) ? (
            <p className="text-center">無符合搜尋或篩選條件的結果。</p>
          ) : (
            <p className="text-center">目前沒有資料。</p>
          )
        )}

      </div>
    </div>
  );
}