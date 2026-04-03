<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\NewspaperType;
use App\Models\Subscriber;
use App\Models\SubscriberNewspaper;
use Illuminate\Database\Seeder;

class SubscriberSeeder extends Seeder
{
    public function run(): void
    {
        $areaA = Area::where('code', 'A')->first();
        $areaB = Area::where('code', 'B')->first();
        $morning = NewspaperType::where('code', 'ASA-M')->first();
        $evening = NewspaperType::where('code', 'ASA-E')->first();

        $subscribers = [
            // A区域 - 30件
            ['area_id' => $areaA->id, 'code' => 'A-001', 'name' => '田中 太郎', 'kana' => 'タナカ タロウ', 'address' => '山口県山口市中央1-1-1', 'lat' => 34.1860, 'lng' => 131.4710],
            ['area_id' => $areaA->id, 'code' => 'A-002', 'name' => '鈴木 花子', 'kana' => 'スズキ ハナコ', 'address' => '山口県山口市中央1-2-3', 'lat' => 34.1865, 'lng' => 131.4715],
            ['area_id' => $areaA->id, 'code' => 'A-003', 'name' => '佐藤 次郎', 'kana' => 'サトウ ジロウ', 'address' => '山口県山口市中央1-3-5', 'lat' => 34.1870, 'lng' => 131.4720],
            ['area_id' => $areaA->id, 'code' => 'A-004', 'name' => '高橋 美咲', 'kana' => 'タカハシ ミサキ', 'address' => '山口県山口市中央2-1-1', 'lat' => 34.1875, 'lng' => 131.4725],
            ['area_id' => $areaA->id, 'code' => 'A-005', 'name' => '伊藤 幸子', 'kana' => 'イトウ サチコ', 'address' => '山口県山口市中央2-2-2', 'lat' => 34.1880, 'lng' => 131.4730],
            ['area_id' => $areaA->id, 'code' => 'A-006', 'name' => '渡辺 健一', 'kana' => 'ワタナベ ケンイチ', 'address' => '山口県山口市中央2-3-4', 'lat' => 34.1885, 'lng' => 131.4735],
            ['area_id' => $areaA->id, 'code' => 'A-007', 'name' => '山本 悦子', 'kana' => 'ヤマモト エツコ', 'address' => '山口県山口市中央3-1-1', 'lat' => 34.1890, 'lng' => 131.4740],
            ['area_id' => $areaA->id, 'code' => 'A-008', 'name' => '中村 浩二', 'kana' => 'ナカムラ コウジ', 'address' => '山口県山口市中央3-2-5', 'lat' => 34.1895, 'lng' => 131.4745],
            ['area_id' => $areaA->id, 'code' => 'A-009', 'name' => '小林 清', 'kana' => 'コバヤシ キヨシ', 'address' => '山口県山口市中央3-3-2', 'lat' => 34.1900, 'lng' => 131.4750],
            ['area_id' => $areaA->id, 'code' => 'A-010', 'name' => '加藤 由美', 'kana' => 'カトウ ユミ', 'address' => '山口県山口市中央4-1-3', 'lat' => 34.1905, 'lng' => 131.4755],
            ['area_id' => $areaA->id, 'code' => 'A-011', 'name' => '吉田 良子', 'kana' => 'ヨシダ ヨシコ', 'address' => '山口県山口市湯田1-1-1', 'lat' => 34.1910, 'lng' => 131.4760],
            ['area_id' => $areaA->id, 'code' => 'A-012', 'name' => '山田 徳男', 'kana' => 'ヤマダ ノリオ', 'address' => '山口県山口市湯田1-2-4', 'lat' => 34.1915, 'lng' => 131.4765],
            ['area_id' => $areaA->id, 'code' => 'A-013', 'name' => '松本 安子', 'kana' => 'マツモト ヤスコ', 'address' => '山口県山口市湯田2-1-1', 'lat' => 34.1920, 'lng' => 131.4770],
            ['area_id' => $areaA->id, 'code' => 'A-014', 'name' => '井上 正雄', 'kana' => 'イノウエ マサオ', 'address' => '山口県山口市湯田2-2-3', 'lat' => 34.1925, 'lng' => 131.4775],
            ['area_id' => $areaA->id, 'code' => 'A-015', 'name' => '木村 幸江', 'kana' => 'キムラ ユキエ', 'address' => '山口県山口市湯田3-1-2', 'lat' => 34.1930, 'lng' => 131.4780],
            // B区域 - 20件
            ['area_id' => $areaB->id, 'code' => 'B-001', 'name' => '林 義雄', 'kana' => 'ハヤシ ヨシオ', 'address' => '山口県山口市小郡1-1-1', 'lat' => 34.1740, 'lng' => 131.4650],
            ['area_id' => $areaB->id, 'code' => 'B-002', 'name' => '清水 春子', 'kana' => 'シミズ ハルコ', 'address' => '山口県山口市小郡1-2-2', 'lat' => 34.1745, 'lng' => 131.4655],
            ['area_id' => $areaB->id, 'code' => 'B-003', 'name' => '山崎 文雄', 'kana' => 'ヤマサキ フミオ', 'address' => '山口県山口市小郡2-1-3', 'lat' => 34.1750, 'lng' => 131.4660],
            ['area_id' => $areaB->id, 'code' => 'B-004', 'name' => '池田 節子', 'kana' => 'イケダ セツコ', 'address' => '山口県山口市小郡2-2-1', 'lat' => 34.1755, 'lng' => 131.4665],
            ['area_id' => $areaB->id, 'code' => 'B-005', 'name' => '橋本 昭夫', 'kana' => 'ハシモト アキオ', 'address' => '山口県山口市小郡3-1-4', 'lat' => 34.1760, 'lng' => 131.4670],
            ['area_id' => $areaB->id, 'code' => 'B-006', 'name' => '阿部 啓子', 'kana' => 'アベ ケイコ', 'address' => '山口県山口市小郡3-2-2', 'lat' => 34.1765, 'lng' => 131.4675],
            ['area_id' => $areaB->id, 'code' => 'B-007', 'name' => '石川 博', 'kana' => 'イシカワ ヒロシ', 'address' => '山口県山口市平川1-1-1', 'lat' => 34.1770, 'lng' => 131.4680],
            ['area_id' => $areaB->id, 'code' => 'B-008', 'name' => '藤田 ミチ', 'kana' => 'フジタ ミチ', 'address' => '山口県山口市平川1-2-3', 'lat' => 34.1775, 'lng' => 131.4685],
            ['area_id' => $areaB->id, 'code' => 'B-009', 'name' => '岡田 和夫', 'kana' => 'オカダ カズオ', 'address' => '山口県山口市平川2-1-2', 'lat' => 34.1780, 'lng' => 131.4690],
            ['area_id' => $areaB->id, 'code' => 'B-010', 'name' => '後藤 光子', 'kana' => 'ゴトウ ミツコ', 'address' => '山口県山口市平川2-2-4', 'lat' => 34.1785, 'lng' => 131.4695],
        ];

        foreach ($subscribers as $data) {
            $subscriber = Subscriber::create([
                'area_id'       => $data['area_id'],
                'customer_code' => $data['code'],
                'name'          => $data['name'],
                'name_kana'     => $data['kana'],
                'address'       => $data['address'],
                'lat'           => $data['lat'],
                'lng'           => $data['lng'],
                'delivery_note' => '1階 郵便受けに投函',
            ]);

            // 朝刊購読
            SubscriberNewspaper::create([
                'subscriber_id'    => $subscriber->id,
                'newspaper_type_id' => $morning->id,
                'quantity'         => 1,
                'start_date'       => '2025-04-01',
            ]);

            // A区域の半数は夕刊も購読
            if (str_starts_with($data['code'], 'A-') && (int)substr($data['code'], 2) <= 8) {
                SubscriberNewspaper::create([
                    'subscriber_id'    => $subscriber->id,
                    'newspaper_type_id' => $evening->id,
                    'quantity'         => 1,
                    'start_date'       => '2025-04-01',
                ]);
            }
        }
    }
}
