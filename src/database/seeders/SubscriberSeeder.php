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
        $areaNZ2 = Area::where('code', 'NZ2')->first();
        $areaNZ1 = Area::where('code', 'NZ1')->first();
        $morning = NewspaperType::where('code', 'ASA-M')->first();
        $evening = NewspaperType::where('code', 'ASA-E')->first();

        // ──────────────────────────────────────────────────────────────────
        // 野里2区域 — 大阪府大阪市西淀川区野里２丁目 の20軒
        // 座標: 中心 34.6918, 135.4577 付近に分散
        // ──────────────────────────────────────────────────────────────────
        $subscribersNZ2 = [
            [
                'code' => 'NZ2-001', 'name' => '西村 隆志', 'kana' => 'ニシムラ タカシ',
                'address' => '大阪府大阪市西淀川区野里２丁目1番1号',
                'address_detail' => null,
                'note' => '郵便受けに投函',
                'lat' => 34.6908, 'lng' => 135.4558,
                'evening' => false,
            ],
            [
                'code' => 'NZ2-002', 'name' => '川口 幸子', 'kana' => 'カワグチ サチコ',
                'address' => '大阪府大阪市西淀川区野里２丁目1番4号',
                'address_detail' => null,
                'note' => '門柱の受け口へ',
                'lat' => 34.6910, 'lng' => 135.4562,
                'evening' => true,
            ],
            [
                'code' => 'NZ2-003', 'name' => '中谷 博之', 'kana' => 'ナカタニ ヒロユキ',
                'address' => '大阪府大阪市西淀川区野里２丁目1番7号',
                'address_detail' => null,
                'note' => 'ドア前に置く',
                'lat' => 34.6912, 'lng' => 135.4565,
                'evening' => false,
            ],
            [
                'code' => 'NZ2-004', 'name' => '前田 和代', 'kana' => 'マエダ カズヨ',
                'address' => '大阪府大阪市西淀川区野里２丁目2番2号',
                'address_detail' => '101号室',
                'note' => '1階 集合ポスト 101番',
                'lat' => 34.6913, 'lng' => 135.4570,
                'evening' => true,
            ],
            [
                'code' => 'NZ2-005', 'name' => '橋本 義男', 'kana' => 'ハシモト ヨシオ',
                'address' => '大阪府大阪市西淀川区野里２丁目2番5号',
                'address_detail' => null,
                'note' => '郵便受けに投函',
                'lat' => 34.6915, 'lng' => 135.4573,
                'evening' => false,
            ],
            [
                'code' => 'NZ2-006', 'name' => '谷口 美代子', 'kana' => 'タニグチ ミヨコ',
                'address' => '大阪府大阪市西淀川区野里２丁目2番9号',
                'address_detail' => null,
                'note' => '玄関脇の新聞受けへ',
                'lat' => 34.6917, 'lng' => 135.4576,
                'evening' => true,
            ],
            [
                'code' => 'NZ2-007', 'name' => '上田 茂', 'kana' => 'ウエダ シゲル',
                'address' => '大阪府大阪市西淀川区野里２丁目3番1号',
                'address_detail' => null,
                'note' => '郵便受けに投函',
                'lat' => 34.6919, 'lng' => 135.4556,
                'evening' => false,
            ],
            [
                'code' => 'NZ2-008', 'name' => '森本 久美', 'kana' => 'モリモト クミ',
                'address' => '大阪府大阪市西淀川区野里２丁目3番3号',
                'address_detail' => '202号室',
                'note' => '2階 202号室 ポスト',
                'lat' => 34.6921, 'lng' => 135.4560,
                'evening' => true,
            ],
            [
                'code' => 'NZ2-009', 'name' => '岸本 正雄', 'kana' => 'キシモト マサオ',
                'address' => '大阪府大阪市西淀川区野里２丁目3番6号',
                'address_detail' => null,
                'note' => '縁側の新聞受け',
                'lat' => 34.6923, 'lng' => 135.4563,
                'evening' => false,
            ],
            [
                'code' => 'NZ2-010', 'name' => '辻本 春江', 'kana' => 'ツジモト ハルエ',
                'address' => '大阪府大阪市西淀川区野里２丁目4番2号',
                'address_detail' => null,
                'note' => '郵便受けに投函',
                'lat' => 34.6916, 'lng' => 135.4581,
                'evening' => true,
            ],
            [
                'code' => 'NZ2-011', 'name' => '久保田 勝', 'kana' => 'クボタ マサル',
                'address' => '大阪府大阪市西淀川区野里２丁目4番5号',
                'address_detail' => null,
                'note' => '門扉の内側へ',
                'lat' => 34.6918, 'lng' => 135.4585,
                'evening' => false,
            ],
            [
                'code' => 'NZ2-012', 'name' => '野口 千恵子', 'kana' => 'ノグチ チエコ',
                'address' => '大阪府大阪市西淀川区野里２丁目4番8号',
                'address_detail' => '1F',
                'note' => '1階 玄関ポスト',
                'lat' => 34.6920, 'lng' => 135.4589,
                'evening' => true,
            ],
            [
                'code' => 'NZ2-013', 'name' => '藤原 清次', 'kana' => 'フジワラ セイジ',
                'address' => '大阪府大阪市西淀川区野里２丁目5番1号',
                'address_detail' => null,
                'note' => '郵便受けに投函',
                'lat' => 34.6924, 'lng' => 135.4567,
                'evening' => false,
            ],
            [
                'code' => 'NZ2-014', 'name' => '安田 洋子', 'kana' => 'ヤスダ ヒロコ',
                'address' => '大阪府大阪市西淀川区野里２丁目5番4号',
                'address_detail' => null,
                'note' => '新聞受けは塀の外側',
                'lat' => 34.6926, 'lng' => 135.4571,
                'evening' => true,
            ],
            [
                'code' => 'NZ2-015', 'name' => '坂本 哲也', 'kana' => 'サカモト テツヤ',
                'address' => '大阪府大阪市西淀川区野里２丁目5番7号',
                'address_detail' => null,
                'note' => 'インターホン不要 郵便受けへ',
                'lat' => 34.6928, 'lng' => 135.4574,
                'evening' => false,
            ],
            [
                'code' => 'NZ2-016', 'name' => '永田 光男', 'kana' => 'ナガタ ミツオ',
                'address' => '大阪府大阪市西淀川区野里２丁目6番2号',
                'address_detail' => null,
                'note' => '郵便受けに投函',
                'lat' => 34.6929, 'lng' => 135.4555,
                'evening' => true,
            ],
            [
                'code' => 'NZ2-017', 'name' => '黒田 節子', 'kana' => 'クロダ セツコ',
                'address' => '大阪府大阪市西淀川区野里２丁目6番5号',
                'address_detail' => null,
                'note' => '犬あり 素早く投函',
                'lat' => 34.6927, 'lng' => 135.4550,
                'evening' => false,
            ],
            [
                'code' => 'NZ2-018', 'name' => '池田 守', 'kana' => 'イケダ マモル',
                'address' => '大阪府大阪市西淀川区野里２丁目7番1号',
                'address_detail' => '301号室',
                'note' => '3階 301号室 ポスト',
                'lat' => 34.6922, 'lng' => 135.4592,
                'evening' => true,
            ],
            [
                'code' => 'NZ2-019', 'name' => '中島 英子', 'kana' => 'ナカシマ ヒデコ',
                'address' => '大阪府大阪市西淀川区野里２丁目7番4号',
                'address_detail' => null,
                'note' => '郵便受けに投函',
                'lat' => 34.6924, 'lng' => 135.4595,
                'evening' => false,
            ],
            [
                'code' => 'NZ2-020', 'name' => '宮本 一郎', 'kana' => 'ミヤモト イチロウ',
                'address' => '大阪府大阪市西淀川区野里２丁目8番3号',
                'address_detail' => null,
                'note' => '自転車置き場横の新聞受け',
                'lat' => 34.6911, 'lng' => 135.4593,
                'evening' => true,
            ],
        ];

        foreach ($subscribersNZ2 as $data) {
            $subscriber = Subscriber::create([
                'area_id'        => $areaNZ2->id,
                'customer_code'  => $data['code'],
                'name'           => $data['name'],
                'name_kana'      => $data['kana'],
                'address'        => $data['address'],
                'address_detail' => $data['address_detail'],
                'lat'            => $data['lat'],
                'lng'            => $data['lng'],
                'delivery_note'  => $data['note'],
            ]);

            SubscriberNewspaper::create([
                'subscriber_id'     => $subscriber->id,
                'newspaper_type_id' => $morning->id,
                'quantity'          => 1,
                'start_date'        => '2025-04-01',
            ]);

            if ($data['evening']) {
                SubscriberNewspaper::create([
                    'subscriber_id'     => $subscriber->id,
                    'newspaper_type_id' => $evening->id,
                    'quantity'          => 1,
                    'start_date'        => '2025-04-01',
                ]);
            }
        }

        // ──────────────────────────────────────────────────────────────────
        // 野里1区域 — 朝刊のみ 5軒（ルートの幅をつけるため）
        // ──────────────────────────────────────────────────────────────────
        $subscribersNZ1 = [
            [
                'code' => 'NZ1-001', 'name' => '吉川 正子', 'kana' => 'ヨシカワ マサコ',
                'address' => '大阪府大阪市西淀川区野里１丁目3番2号',
                'lat' => 34.6895, 'lng' => 135.4562,
            ],
            [
                'code' => 'NZ1-002', 'name' => '田中 武雄', 'kana' => 'タナカ タケオ',
                'address' => '大阪府大阪市西淀川区野里１丁目3番5号',
                'lat' => 34.6898, 'lng' => 135.4568,
            ],
            [
                'code' => 'NZ1-003', 'name' => '木村 トシ', 'kana' => 'キムラ トシ',
                'address' => '大阪府大阪市西淀川区野里１丁目4番1号',
                'lat' => 34.6901, 'lng' => 135.4572,
            ],
            [
                'code' => 'NZ1-004', 'name' => '荒木 敏夫', 'kana' => 'アラキ トシオ',
                'address' => '大阪府大阪市西淀川区野里１丁目4番6号',
                'lat' => 34.6903, 'lng' => 135.4578,
            ],
            [
                'code' => 'NZ1-005', 'name' => '浜田 良江', 'kana' => 'ハマダ ヨシエ',
                'address' => '大阪府大阪市西淀川区野里１丁目5番3号',
                'lat' => 34.6897, 'lng' => 135.4582,
            ],
        ];

        foreach ($subscribersNZ1 as $data) {
            $subscriber = Subscriber::create([
                'area_id'       => $areaNZ1->id,
                'customer_code' => $data['code'],
                'name'          => $data['name'],
                'name_kana'     => $data['kana'],
                'address'       => $data['address'],
                'lat'           => $data['lat'],
                'lng'           => $data['lng'],
                'delivery_note' => '郵便受けに投函',
            ]);

            SubscriberNewspaper::create([
                'subscriber_id'     => $subscriber->id,
                'newspaper_type_id' => $morning->id,
                'quantity'          => 1,
                'start_date'        => '2025-04-01',
            ]);
        }
    }
}
