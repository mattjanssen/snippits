<?php

namespace AppBundle\Command;

use GuzzleHttp\Client;
use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class ReserveCommand extends ContainerAwareCommand
{
    const SECONDS_TO_TRY = 5;
    const RESERVE_URL = 'https://www.rec.gov/switchBookingAction.do';

    protected function configure()
    {
        $this
            ->setName('app:reserve');
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $mailer = $this->getContainer()->get('mailer');

        $parameters = [
            'contractCode' => 'NRSO',
            'parkId' => '73141',
            'siteId' => '109515',
            'arvdate' => '08/01/2017',
            'lengthOfStay' => '14',
        ];

        $client = new Client();
        $url = self::RESERVE_URL . '?' . http_build_query($parameters);
        $startTime = time();

        $output->writeln('Trying to reserve: ' . $url);

        do {
            $output->write('.');

            $response = $client->request('GET', $url);
            $body = $response->getBody()->getContents();

            if (strpos($body, '<title>Sign In - Recreation.gov</title>') !== false) {
                $cookies = join(';', $response->getHeader('Set-Cookie'));
                $output->writeln($cookies);

                $message = \Swift_Message::newInstance()
                    ->setSubject('Campground Reserved')
                    ->setFrom('j.doe@gmail.com')
                    ->setTo('j.doe@gmail.com')
                    ->setBody($url . ' Cookies: ' . $cookies);

                $mailer->send($message);

                return;
            }

            if (time() - $startTime > self::SECONDS_TO_TRY) {
                break;
            }
        } while (true);

        $output->writeln('Reserve failed.');

        $message = \Swift_Message::newInstance()
            ->setSubject('Campground Reservation Failed')
            ->setFrom('j.doe@gmail.com')
            ->setTo('j.doe@gmail.com')
            ->setBody($url);

        $mailer->send($message);
    }
}
