'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { ProductEntity } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { CellAction } from './cell-action';
import { CATEGORY_OPTIONS } from './options';

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  // Check if it's a valid URL (starts with http:// or https://)
  return url.startsWith('http://') || url.startsWith('https://');
}

export const columns: ColumnDef<ProductEntity>[] = [
  {
    id: 'Image',
    accessorKey: 'Image',
    header: 'IMAGE',
    cell: ({ row }) => {
      const imageUrl = row.getValue('Image') as string;
      const name = row.getValue('Name') as string;
      
      // Check if URL is valid for next/image
      if (imageUrl && isValidImageUrl(imageUrl)) {
        return (
          <div className='relative aspect-square'>
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes='80px'
              className='rounded-lg object-cover'
            />
          </div>
        );
      }
      
      // Show placeholder for invalid/missing URLs
      return (
        <div className='flex h-full w-full items-center justify-center rounded-lg bg-muted'>
          <Icons.media className='h-8 w-8 text-muted-foreground' />
        </div>
      );
    },
  },
  {
    id: 'Name',
    accessorKey: 'Name',
    header: ({ column }: { column: Column<ProductEntity, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ProductEntity['Name']>()}</div>,
    meta: {
      label: 'Name',
      placeholder: 'Search products...',
      variant: 'text',
      icon: Icons.text,
    },
    enableColumnFilter: true,
  },
  {
    id: 'NickName',
    accessorKey: 'NickName',
    header: 'NICKNAME',
    cell: ({ row }) => <div className='text-muted-foreground'>{row.getValue('NickName') || '-'}</div>,
  },
  {
    id: 'categories',
    accessorKey: 'categories',
    enableSorting: false,
    header: ({ column }: { column: Column<ProductEntity, unknown> }) => (
      <DataTableColumnHeader column={column} title='Categories' />
    ),
    cell: ({ cell }) => {
      const categories = cell.getValue<ProductEntity['categories']>();
      if (!categories || categories.length === 0) {
        return <span className='text-muted-foreground'>-</span>;
      }
      return (
        <div className='flex flex-wrap gap-1'>
          {categories.slice(0, 2).map((cat) => (
            <Badge key={cat.CategoryID} variant='outline' className='capitalize'>
              {cat.Name}
            </Badge>
          ))}
          {categories.length > 2 && (
            <Badge variant='outline'>+{categories.length - 2}</Badge>
          )}
        </div>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'categories',
      variant: 'multiSelect',
      options: CATEGORY_OPTIONS,
    },
  },
  {
    id: 'distributor',
    accessorKey: 'distributor',
    header: 'DISTRIBUTOR',
    cell: ({ row }) => {
      const distributor = row.getValue('distributor') as ProductEntity['distributor'];
      return distributor ? (
        <Badge variant='outline'>{distributor.Name}</Badge>
      ) : (
        <span className='text-muted-foreground'>-</span>
      );
    },
  },
  {
    id: 'sellingPrice',
    header: 'PRICE',
    cell: ({ row }) => {
      // Access from row.original since productPrices is a nested relation
      const product = row.original;
      const prices = product.productPrices;
      if (!prices || prices.length === 0) {
        return <span className='text-muted-foreground'>-</span>;
      }
      const latestPrice = prices[0];
      const currency = latestPrice.Currency || 'USD';
      return (
        <span>
          {currency} {latestPrice.SellingPrice.toFixed(2)}
        </span>
      );
    },
  },
  {
    id: 'Description',
    accessorKey: 'Description',
    header: 'DESCRIPTION',
    cell: ({ row }) => {
      const desc = row.getValue('Description') as string;
      return (
        <div className='max-w-[200px] truncate text-muted-foreground'>
          {desc || '-'}
        </div>
      );
    },
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<ProductEntity, unknown> }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<ProductEntity['createdAt']>();
      return date ? new Date(date).toLocaleDateString() : '-';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
